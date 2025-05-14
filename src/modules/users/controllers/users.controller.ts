import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation } from '@nestjs/swagger';
import { IsNull, Not } from 'typeorm';

import { ApiSuccessResponse } from '@/base/decorators';
import { QueryDto } from '@/base/dtos';
import { Admin, CurrentUser } from '@/modules/auth';

import { DeletedUserProfileDto, UpdateUserDto, UserProfileDto } from '../dtos/user.dtos';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: "Retrieve the current user's profile",
  })
  @ApiSuccessResponse({
    schema: UserProfileDto,
    description: 'User profile retrieved successfully',
  })
  @Get('/profile')
  getCurrentUserProfile(@CurrentUser() user: User) {
    return UserProfileDto.fromUser(user);
  }

  @ApiOperation({
    summary: "Update the current user's profile",
  })
  @ApiSuccessResponse({
    schema: UserProfileDto,
    description: 'User profile updated successfully',
  })
  @Patch('/profile')
  async updateCurrentUserProfile(
    @CurrentUser() currentUser: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateUserProfile({
      ...updateUserDto,
      id: currentUser.id,
    });
    return UserProfileDto.fromUser(user);
  }

  @ApiOperation({
    summary: 'Retrieve all users',
  })
  @ApiSuccessResponse({
    schema: UserProfileDto,
    description: 'All user profiles retrieved successfully',
  })
  @Admin()
  @Get('/')
  async findAllUsers(@Query() queryDto: QueryDto) {
    const { data: users, metadata } = await this.usersService.find({
      filters: queryDto,
      relations: ['account'],
    });

    return {
      data: users.map((user) => UserProfileDto.fromUser(user)),
      metadata,
    };
  }

  @ApiOperation({
    summary: 'Retrieve all deleted users',
  })
  @ApiSuccessResponse({
    schema: UserProfileDto,
    description: 'All user profiles retrieved successfully',
  })
  @Admin()
  @Get('/deleted')
  async findAllDeletedUsers(@Query() queryDto: QueryDto) {
    const { data: users, metadata } = await this.usersService.find({
      filters: {
        ...queryDto,
        deleteTimestamp: Not(IsNull()),
      },
      relations: ['account'],
      withDeleted: true,
    });

    return {
      data: users.map((user) => DeletedUserProfileDto.fromUser(user)),
      metadata,
    };
  }

  @ApiOperation({
    summary: 'Delete a user by id',
  })
  @ApiNoContentResponse({
    description: 'User deleted successfully',
  })
  @Admin()
  @Delete('/delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@CurrentUser() currentUser: User, @Param('id') id: string) {
    await this.usersService.softDelete(currentUser.id, {
      where: { id },
    });
  }

  @ApiOperation({
    summary: 'Restore a deleted user by id',
  })
  @ApiSuccessResponse({
    schema: UserProfileDto,
    description: 'User restored successfully',
  })
  @Admin()
  @Patch('/restore/:id')
  async restoreUser(@CurrentUser() currentUser: User, @Param('id') id: string) {
    return this.usersService.restore(currentUser.id, {
      where: { id },
    });
  }
}
