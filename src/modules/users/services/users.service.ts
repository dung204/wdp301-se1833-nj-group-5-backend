import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { BaseService } from '@/base/services';

import { UpdateUserDto } from '../dtos/user.dtos';
import { User } from '../entities/user.entity';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(protected readonly repository: UsersRepository) {
    const logger = new Logger(UsersService.name);
    super(repository, logger);
  }

  async updateUserProfile({ id, ...payload }: UpdateUserDto) {
    const isExistedUser = await this.repository.existsBy({
      id,
    });

    if (!isExistedUser) {
      throw new NotFoundException('User not found');
    }

    return (
      await this.update(id, payload, {
        where: { id },
        relations: ['account'],
      })
    )[0];
  }
}
