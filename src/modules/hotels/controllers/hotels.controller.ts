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
import { transformDataToDto } from '@/base/utils';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import {
  CreateHotelDto,
  DeletedHotelResponseDto,
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
  async searchHotels(@Query() hotelQueryDto: HotelQueryDto) {
    const result = await this.hotelsService.find({
      queryDto: hotelQueryDto,
      filter: { deleteTimestamp: null },
    });

    return {
      data: transformDataToDto(HotelResponseDto, result.data),
      metadata: result.metadata,
    };
  }

  @ApiOperation({
    summary: 'Get all hotels including deleted ones (Admin and hotel owner only)',
    description:
      'Retrieve all hotels with pagination, sorting and filtering options, including soft-deleted hotels',
  })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    isArray: true,
    description: 'All hotels retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Get('/admin/')
  async getAllHotelsForAdmin(
    @CurrentUser() user: User,
    @Query() hotelQueryDto: HotelQueryDtoForAdmin,
  ) {
    const result = await this.hotelsService.find(
      {
        queryDto: hotelQueryDto,
      },
      user,
    );

    return {
      data: transformDataToDto(DeletedHotelResponseDto, result.data),
      metadata: result.metadata,
    };
  }

  @ApiOperation({
    summary: 'Create a new hotel',
    description: 'Create a new hotel with the current user as owner',
  })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    description: 'Hotel created successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Post()
  async createHotel(@CurrentUser() user: User, @Body() createHotelDto: CreateHotelDto) {
    const hotel = await this.hotelsService.createOne({
      ...createHotelDto,
      owner: user,
    });
    return transformDataToDto(DeletedHotelResponseDto, hotel);
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
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Patch(':id')
  async updateHotel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateHotelDto: UpdateHotelDto,
  ) {
    return transformDataToDto(
      DeletedHotelResponseDto,
      this.hotelsService.update(updateHotelDto, { _id: id }, user),
    );
  }

  @ApiOperation({
    summary: 'Delete a hotel',
    description: 'Soft delete a hotel (only for owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiNoContentResponse({
    description: 'Hotel deleted successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHotel(@CurrentUser() user: User, @Param('id') id: string) {
    // return this.hotelsService.softDelete({_id: id}, user);
    return this.hotelsService.deleteHotel(user, id);
  }

  @ApiOperation({
    summary: 'Restore a hotel',
    description: 'Restore a hotel (only for owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    description: 'Hotel restore successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Patch('restore/:id')
  @HttpCode(HttpStatus.OK)
  async restoreHotel(@Param('id') id: string, @CurrentUser() user: User) {
    const result = await this.hotelsService.restore(
      {
        _id: id,
      },
      user,
    );

    return transformDataToDto(DeletedHotelResponseDto, result);
  }
}
