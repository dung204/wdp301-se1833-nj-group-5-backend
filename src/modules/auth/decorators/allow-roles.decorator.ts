import { SetMetadata } from '@nestjs/common';

import { Role } from '../enums/role.enum';

export const ALLOW_ROLES_KEY = 'allowRoles';

/**
 * A custom decorator to specify allowed roles for route handlers or controllers.
 *
 * @param roles - An array of `Role` values that are permitted access. Defaults to all roles if not specified.
 */
export const AllowRoles = (roles: Role[] = Object.values(Role)) =>
  SetMetadata(ALLOW_ROLES_KEY, roles);
