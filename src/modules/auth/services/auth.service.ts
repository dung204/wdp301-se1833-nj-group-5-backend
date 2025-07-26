import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

import { configs } from '@/base/configs';
import { RedisService } from '@/base/database';
import { PasswordUtils } from '@/base/utils/password.utils';
import { User } from '@/modules/users/schemas/user.schema';
import { UsersService } from '@/modules/users/services/users.service';

import { JwtPayloadDto, LoginDto, LoginSuccessDto, RegisterDto } from '../dtos/auth.dtos';

@Injectable()
export class AuthService {
  private readonly ACCESS_EXPIRATION_TIME = 1800; // 30 minutes
  private readonly REFRESH_EXPIRATION_TIME = 604800; // 1 week
  private readonly BLACKLISTED = 'BLACKLISTED';

  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async login(payload: LoginDto): Promise<LoginSuccessDto> {
    const { email, password } = payload;
    const user = await this.usersService.findOne({
      email,
    });

    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }

    const isMatchPassword = PasswordUtils.isMatchPassword(password, user.password);

    if (!isMatchPassword) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }

    return {
      ...(await this.getTokens({ sub: user!._id })),
      user: {
        id: user!._id,
        role: user!.role,
        fullName: user!.fullName,
        gender: user!.gender,
      },
    };
  }

  async register(payload: RegisterDto): Promise<LoginSuccessDto> {
    const { email, password } = payload;
    const existedUser = await this.usersService.findOne({
      email,
    });
    const hashedPassword = PasswordUtils.hashPassword(password);
    let newUser: User;

    if (!existedUser) {
      const userId = randomUUID();
      newUser = await this.usersService.createOne({
        _id: userId,
        email,
        password: hashedPassword,
      });
    } else if (!existedUser.deleteTimestamp) {
      throw new ConflictException('Email has already been registered.');
    } else {
      newUser = (
        await this.usersService.update({
          ...existedUser,
          ...payload,
          password: hashedPassword,
          deleteTimestamp: null,
        })
      )[0];
    }

    return {
      ...(await this.getTokens({ sub: newUser._id })),
      user: {
        id: newUser._id,
        role: newUser.role,
        fullName: newUser.fullName,
        gender: newUser.gender,
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
      _id: userId,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.blacklistToken(refreshToken);

    return {
      ...(await this.getTokens({ sub: userId })),
      user: {
        id: user._id,
        role: user.role,
        fullName: user.fullName,
        gender: user.gender,
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
    const refreshToken = await this.redisService.get(`REFRESH_TOKEN_${user._id}`, true);

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
