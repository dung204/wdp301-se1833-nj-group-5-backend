import { createParamDecorator } from '@nestjs/common';

import { User } from '@/modules/users/schemas/user.schema';

export const CurrentUser = createParamDecorator((_, context) => {
  const request = context.switchToHttp().getRequest();
  return request.user as User;
});
