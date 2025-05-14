import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

import { configs } from '@/base/configs';
import { RedisService } from '@/base/database';
import { BaseService } from '@/base/services';
import { PasswordUtils } from '@/base/utils/password.utils';
import { User, UsersService } from '@/modules/users';

import { JwtPayloadDto, LoginDto, LoginSuccessDto, RegisterDto } from '../dtos/auth.dtos';
import { Account } from '../entities/account.entity';
import { AccountRepository } from '../repository/account.repository';

@Injectable()
export class AuthService extends BaseService<Account> {
  private readonly ACCESS_EXPIRATION_TIME = 1800; // 30 minutes
  private readonly REFRESH_EXPIRATION_TIME = 604800; // 1 week
  private readonly BLACKLISTED = 'BLACKLISTED';

  constructor(
    protected readonly repository: AccountRepository,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {
    const logger = new Logger(AuthService.name);
    super(repository, logger);
  }

  async login(payload: LoginDto): Promise<LoginSuccessDto> {
    const { email, password } = payload;
    const account = await this.findOne({
      where: {
        email,
      },
    });

    if (!account) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }

    const isMatchPassword = PasswordUtils.isMatchPassword(password, account.password);

    if (!isMatchPassword) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }

    const user = await this.usersService.findOne({
      where: { account },
    });

    return {
      ...(await this.getTokens({ sub: user!.id })),
      user: {
        id: user!.id,
        fullName: user!.fullName,
      },
    };
  }

  async register(payload: RegisterDto): Promise<LoginSuccessDto> {
    const { email, password } = payload;
    const existedAccount = await this.findOne({
      where: { email },
      withDeleted: true,
    });
    const hashedPassword = PasswordUtils.hashPassword(password);
    let newAccount: Account;

    if (!existedAccount) {
      const userId = randomUUID();
      newAccount = await this.createOne(userId, {
        id: userId,
        email,
        password: hashedPassword,
      });
    } else if (!existedAccount.deleteTimestamp) {
      throw new ConflictException('Email has already been registered.');
    } else {
      newAccount = (
        await this.update(existedAccount.id, {
          ...existedAccount,
          ...payload,
          password: hashedPassword,
          deleteTimestamp: null,
          deleteUserId: null,
        })
      )[0];
    }

    let userInfo = await this.usersService.findOne({
      where: {
        account: newAccount,
      },
    });

    if (!userInfo) {
      userInfo = await this.usersService.createOne(newAccount.id, {
        account: newAccount,
      });
    }

    return {
      ...(await this.getTokens({ sub: userInfo.id })),
      user: {
        id: userInfo.id,
        fullName: userInfo.fullName,
      },
    };
  }

  async refresh(refreshToken: string): Promise<LoginSuccessDto> {
    if (await this.isTokenBlacklisted(refreshToken)) {
      throw new UnauthorizedException('Refresh token is blacklisted.');
    }

    const { sub: userId } = this.jwtService.verify<JwtPayloadDto>(refreshToken, {
      secret: configs.REFRESH_SECRET_KEY,
    });

    const user = await this.usersService.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.blacklistToken(refreshToken);

    return {
      ...(await this.getTokens({ sub: userId })),
      user: {
        id: user.id,
        fullName: user.fullName,
      },
    };
  }

  async getTokens(payload: JwtPayloadDto) {
    const accessToken = this.jwtService.sign(payload, {
      secret: configs.ACCESS_SECRET_KEY,
      expiresIn: this.ACCESS_EXPIRATION_TIME,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: configs.REFRESH_SECRET_KEY,
      expiresIn: this.REFRESH_EXPIRATION_TIME,
    });

    await this.redisService.set(
      `REFRESH_TOKEN_${payload.sub}`,
      refreshToken,
      this.REFRESH_EXPIRATION_TIME,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(user: User, accessToken: string) {
    const refreshToken = await this.redisService.get(`REFRESH_TOKEN_${user.id}`, true);

    await this.blacklistToken(accessToken);
    if (refreshToken) await this.blacklistToken(refreshToken);
  }

  async blacklistToken(token: string) {
    const { exp } = this.jwtService.decode(token);
    await this.redisService.set(token, this.BLACKLISTED, exp - Math.ceil(Date.now() / 1000));
  }

  async isTokenBlacklisted(token: string) {
    return (await this.redisService.get(token)) === this.BLACKLISTED;
  }
}
