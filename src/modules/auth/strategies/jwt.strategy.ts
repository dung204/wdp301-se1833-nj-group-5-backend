import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { configs } from '@/base/configs';
import { UsersService } from '@/modules/users/services/users.service';

import { JwtPayloadDto } from '../dtos/auth.dtos';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (_, rawJwtToken: string, done) => {
        if (await authService.isTokenBlacklisted(rawJwtToken)) {
          done(new UnauthorizedException('Access token is blacklisted.'));
          return;
        }

        done(null, configs.ACCESS_SECRET_KEY);
      },
    });
  }

  async validate(payload: JwtPayloadDto) {
    const id = payload.sub;
    const user = await this.usersService.findOne({
      _id: id,
      deleteTimestamp: null,
    });

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
