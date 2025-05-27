import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

import { ApiSuccessResponse } from '@/base/decorators';
import { QueryDto } from '@/base/dtos';
import { Admin } from '@/modules/auth/decorators/admin.decorator';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import {
  CreateHotelDto,
  HotelQueryDto,
  HotelQueryDtoForAdmin,
  HotelResponseDto,
  UpdateHotelDto,
} from '../dtos/hotel.dto';
import { HotelsService } from '../services/hotels.service';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @ApiOperation({
    summary: 'Search filter hotels, get all hotels, get hotel by ID',
    description: 'Search hotels with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    isArray: true,
    description: 'Hotels retrieved successfully',
  })
  @Public()
  @Get('/')
  async searchHotels(
    @CurrentUser() user: User,
    @Query() queryDto: QueryDto,
    @Query() hotelQueryDto: HotelQueryDto,
  ) {
    // Nếu không phải admin, chỉ cho phép xem hotels đang active
    const filter = { deleteTimestamp: null };
    return this.hotelsService.findHotels({ queryDto, hotelQueryDto, filter });
  }

  @ApiOperation({
    summary: 'Get all hotels including deleted ones (Admin only)',
    description:
      'Retrieve all hotels with pagination, sorting and filtering options, including soft-deleted hotels',
  })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    isArray: true,
    description: 'All hotels retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Get('/admin/all')
  async getAllHotelsForAdmin(
    @CurrentUser() user: User,
    @Query() queryDto: QueryDto,
    @Query() hotelQueryDto: HotelQueryDtoForAdmin,
  ) {
    const filter = this.buildAdminFilter(user, hotelQueryDto);

    return this.hotelsService.findHotels({
      queryDto,
      hotelQueryDto,
      filter,
    });
  }

  private buildAdminFilter(user: User, hotelQueryDto: HotelQueryDtoForAdmin) {
    const filter: Record<string, any> = {};

    // Add owner filter for non-admin users
    if (user.role !== Role.ADMIN) {
      filter.owner = user._id;
    }

    if (hotelQueryDto.ownerId && user.role === Role.ADMIN) {
      // If admin is querying by ownerId, apply that filter
      filter.owner = hotelQueryDto.ownerId;
    }

    // Add active/deleted filter based on isActive query param
    if (hotelQueryDto.isActive) {
      switch (hotelQueryDto.isActive) {
        case 'true':
          filter.deleteTimestamp = null;
          break;
        case 'false':
          filter.deleteTimestamp = { $ne: null };
          break;
        // case 'all' - no filter needed
      }
    }

    return filter;
  }

  @ApiOperation({
    summary: 'Create a new hotel',
    description: 'Create a new hotel with the current user as owner',
  })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    description: 'Hotel created successfully',
  })
  @Admin()
  @Post()
  async createHotel(@CurrentUser() user: User, @Body() createHotelDto: CreateHotelDto) {
    return this.hotelsService.createHotel(user, createHotelDto);
  }

  @ApiOperation({
    summary: 'Update a hotel',
    description: 'Update a hotel (only for owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    description: 'Hotel updated successfully',
  })
  @Admin()
  @Patch(':id')
  async updateHotel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateHotelDto: UpdateHotelDto,
  ) {
    return this.hotelsService.updateHotel(user, id, updateHotelDto);
  }

  @ApiOperation({
    summary: 'Delete a hotel',
    description: 'Soft delete a hotel (only for owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiNoContentResponse({
    description: 'Hotel deleted successfully',
  })
  @Admin()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHotel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.hotelsService.deleteHotel(user, id);
  }

  @ApiOperation({
    summary: 'Restore a hotel',
    description: 'Restore a hotel (only for owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiNoContentResponse({
    description: 'Hotel restore successfully',
  })
  @Admin()
  @Patch('restore/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async restoreHotel(@Param('id') id: string) {
    return this.hotelsService.restore({
      _id: id,
    });
  }

  @ApiOperation({
    summary: 'Get hotels by owner',
    description: 'Retrieve all hotels owned by a specific user',
  })
  @ApiParam({ name: 'ownerId', description: 'Owner ID' })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    isArray: true,
    description: 'Hotels retrieved successfully',
  })
  @Public()
  @Get('owner/:ownerId')
  async getHotelsByOwner(@Param('ownerId') ownerId: string) {
    return this.hotelsService.getHotelsByOwner(ownerId);
  }
}
