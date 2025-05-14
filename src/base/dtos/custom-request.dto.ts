import { User } from '@/modules/users/schemas/user.schema';

export class CustomRequest extends Request {
  user?: User;
}
