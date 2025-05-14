import { User } from '@/modules/users';

export class CustomRequest extends Request {
  user?: User;
}
