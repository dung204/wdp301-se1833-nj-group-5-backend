import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';

import { UpdateUserDto } from '../dtos/user.dtos';
import { User } from '../schemas/user.schema';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(@InjectModel(User.name) protected readonly model: Model<User>) {
    const logger = new Logger(UsersService.name);
    super(model, logger);
  }

  async updateUserProfile(user: User, payload: UpdateUserDto) {
    return (
      await this.update(payload, {
        _id: user._id,
      })
    )[0];
  }
}
