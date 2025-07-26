import { SetMetadata } from '@nestjs/common';

import { Role } from '../enums/role.enum';

export const OPTIONAL_AUTH_KEY = 'allowRoles';

/**
 * Decorator to mark a route as optionally authenticated.
 *
 * If used, the route can be accessed with or without authentication.
 * Optionally, you can specify an array of roles that are allowed to access the route.
 * If no roles are provided, all roles defined in the `Role` enum are allowed by default.
 *
 * @param roles - An array of `Role` values specifying which roles are allowed to access the route. Defaults to all roles.
 * @returns A decorator function that sets the optional authentication metadata for the route.
 */
export const OptionalAuth = (roles: Role[] = Object.values(Role)) =>
  SetMetadata(OPTIONAL_AUTH_KEY, roles);
