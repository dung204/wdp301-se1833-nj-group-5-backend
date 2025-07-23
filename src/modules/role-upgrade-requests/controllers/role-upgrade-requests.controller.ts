import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

import { ApiSuccessResponse } from '@/base/decorators';
import { transformDataToDto } from '@/base/utils';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import {
  CreateRoleUpgradeRequestDto,
  RoleUpgradeRequestResponseDto,
  UpdateRoleUpgradeRequestDto,
} from '../dtos/role-upgrade-request.dto';
import { RoleUpgradeRequestsService } from '../services/role-upgrade-requests.service';

@Controller('role-upgrade-requests')
export class RoleUpgradeRequestsController {
  constructor(private readonly roleUpgradeRequestsService: RoleUpgradeRequestsService) {}

  @ApiOperation({
    summary: 'Submit a role upgrade request',
    description: 'Allows customers to submit a request to upgrade their role to hotel owner',
  })
  @ApiSuccessResponse({
    schema: RoleUpgradeRequestResponseDto,
    description: 'Role upgrade request submitted successfully',
  })
  @AllowRoles([Role.CUSTOMER])
  @Post()
  async createRequest(@CurrentUser() user: User, @Body() createDto: CreateRoleUpgradeRequestDto) {
    const request = await this.roleUpgradeRequestsService.createRequest(user, createDto);
    return transformDataToDto(RoleUpgradeRequestResponseDto, request);
  }

  @ApiOperation({
    summary: 'Get all role upgrade requests (Admin only)',
    description: 'Retrieve all role upgrade requests for admin review',
  })
  @ApiSuccessResponse({
    schema: RoleUpgradeRequestResponseDto,
    description: 'Role upgrade requests retrieved successfully',
    isArray: true,
  })
  @AllowRoles([Role.ADMIN])
  @Get()
  async getAllRequests(@Query() queryDto: any) {
    const result = await this.roleUpgradeRequestsService.find({
      queryDto,
    });
    return {
      data: transformDataToDto(RoleUpgradeRequestResponseDto, result.data),
      metadata: result.metadata,
    };
  }

  @ApiOperation({
    summary: 'Get current user role upgrade request',
    description: 'Get the current user role upgrade request (any status)',
  })
  @ApiSuccessResponse({
    schema: RoleUpgradeRequestResponseDto,
    description: 'User role upgrade request retrieved successfully',
  })
  @AllowRoles([Role.CUSTOMER, Role.HOTEL_OWNER])
  @Get('my-request')
  async getCurrentUserRequest(@CurrentUser() user: User) {
    const request = await this.roleUpgradeRequestsService.getUserRequest(user._id);
    if (!request) {
      return null;
    }
    return transformDataToDto(RoleUpgradeRequestResponseDto, request);
  }

  @ApiOperation({
    summary: 'Update role upgrade request status (Admin only)',
    description: 'Allows admin to approve, reject, or mark requests under review',
  })
  @ApiParam({ name: 'id', description: 'Role upgrade request ID' })
  @ApiSuccessResponse({
    schema: RoleUpgradeRequestResponseDto,
    description: 'Role upgrade request status updated successfully',
  })
  @AllowRoles([Role.ADMIN])
  @Patch(':id')
  async updateRequestStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateRoleUpgradeRequestDto,
    @CurrentUser() adminUser: User,
  ) {
    const request = await this.roleUpgradeRequestsService.updateRequestStatus(
      id,
      updateDto,
      adminUser,
    );
    return transformDataToDto(RoleUpgradeRequestResponseDto, request);
  }

  @ApiOperation({
    summary: 'Get role upgrade request by ID (Admin only)',
    description: 'Retrieve a specific role upgrade request by ID',
  })
  @ApiParam({ name: 'id', description: 'Role upgrade request ID' })
  @ApiSuccessResponse({
    schema: RoleUpgradeRequestResponseDto,
    description: 'Role upgrade request retrieved successfully',
  })
  @AllowRoles([Role.ADMIN])
  @Get(':id')
  async getRequestById(@Param('id') id: string) {
    const request = await this.roleUpgradeRequestsService.findOne({ _id: id });
    if (!request) {
      return null;
    }
    return transformDataToDto(RoleUpgradeRequestResponseDto, request);
  }
}
