import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation } from '@nestjs/swagger';

import { ApiSuccessResponse } from '@/base/decorators';
import { QueryDto } from '@/base/dtos';
import { Admin } from '@/modules/auth/decorators/admin.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { DeletedUserProfileDto, UpdateUserDto, UserProfileDto } from '../dtos/user.dtos';
import { User } from '../schemas/user.schema';
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
    return UserProfileDto.mapToDto(user);
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
    const user = await this.usersService.updateUserProfile(currentUser, updateUserDto);
    return UserProfileDto.mapToDto(user);
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
      queryDto,
      filter: {
        deleteTimestamp: null,
      },
    });

    return {
      data: users.map((user) => UserProfileDto.mapToDto(user)),
      metadata,
    };
  }

  @ApiOperation({
    summary: 'Retrieve all deleted users',
  })
  @ApiSuccessResponse({
    schema: DeletedUserProfileDto,
    description: 'All user profiles retrieved successfully',
  })
  @Admin()
  @Get('/deleted')
  async findAllDeletedUsers(@Query() queryDto: QueryDto) {
    const { data: users, metadata } = await this.usersService.find({
      queryDto,
      filter: {
        deleteTimestamp: { $ne: null },
      },
    });

    return {
      data: users.map((user) => DeletedUserProfileDto.mapToDto(user)),
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
    if (id === currentUser._id) {
      throw new ForbiddenException('You can not delete yourself.');
    }

    await this.usersService.softDelete(currentUser._id, {
      _id: id,
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
    return this.usersService.restore(currentUser._id, {
      _id: id,
    });
  }
}
