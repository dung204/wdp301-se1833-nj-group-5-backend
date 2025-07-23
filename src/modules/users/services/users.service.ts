import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';

import { UpdateUserDto, UpgradeRoleDto } from '../dtos/user.dtos';
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

  async upgradeUserRole(user: User, payload: UpgradeRoleDto) {
    // Check if user is currently a CUSTOMER
    if (user.role !== Role.CUSTOMER) {
      throw new BadRequestException(
        `Cannot upgrade role from ${user.role}. Only CUSTOMER role can be upgraded to HOTEL_OWNER.`,
      );
    }

    // Check if target role is HOTEL_OWNER
    if (payload.targetRole !== Role.HOTEL_OWNER) {
      throw new BadRequestException('Only upgrade to HOTEL_OWNER role is supported.');
    }

    // Update the user's role while preserving all existing data
    const updatedUser = await this.update(
      {
        role: payload.targetRole,
      },
      {
        _id: user._id,
      },
    );

    return updatedUser[0];
  }
}
