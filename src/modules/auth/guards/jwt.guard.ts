import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { User } from '@/modules/users/schemas/user.schema';

import { ALLOW_ROLES_KEY } from '../decorators/allow-roles.decorator';
import { OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class JwtGuard extends AuthGuard(['jwt']) {
  constructor(private readonly reflector: Reflector) {
    super();
  }
  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const allowRoles = this.reflector.getAllAndOverride<Role[]>(ALLOW_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const optionalAuth = this.reflector.getAllAndOverride<Role[]>(OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isAuthenticated = await super.canActivate(context);

    if (!isAuthenticated && Array.isArray(optionalAuth)) {
      return true;
    }

    if (isAuthenticated) {
      const currentUser: User = context.switchToHttp().getRequest().user;
      if (
        (Array.isArray(allowRoles) && !allowRoles.includes(currentUser.role)) ||
        (Array.isArray(optionalAuth) && !optionalAuth.includes(currentUser.role))
      )
        throw new ForbiddenException(
          `This operation is only allowed for these roles: ${allowRoles.map((role) => `'${role}'`).join(', ')}.`,
        );
    }

    return !!isAuthenticated;
  }
}
