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
  Put,
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

import { ApiSuccessResponse } from '@/base/decorators';
import { QueryDto } from '@/base/dtos';
import { Admin } from '@/modules/auth/decorators/admin.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateHotelDto, HotelQueryDto, HotelResponseDto, UpdateHotelDto } from '../dtos/hotel.dto';
import { HotelsService } from '../services/hotels.service';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @ApiOperation({
    summary: 'Retrieve all active hotels',
    description: 'Get a list of all active hotels',
  })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    isArray: true,
    description: 'Hotels retrieved successfully',
  })
  @Public()
  @Get()
  async getAllHotels() {
    return this.hotelsService.getAllHotels();
  }

  @ApiOperation({
    summary: 'Search and filter hotels',
    description: 'Search hotels with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    isArray: true,
    description: 'Hotels retrieved successfully',
  })
  @Public()
  @Get('/search')
  async searchHotels(@Query() queryDto: QueryDto, @Query() hotelQueryDto: HotelQueryDto) {
    return this.hotelsService.findHotels({ queryDto, hotelQueryDto });
  }

  @ApiOperation({
    summary: 'Get a hotel by ID',
    description: 'Retrieve detailed information about a specific hotel',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    description: 'Hotel retrieved successfully',
  })
  @Public()
  @Get(':id')
  async getHotelById(@Param('id') id: string) {
    return this.hotelsService.getHotelById(id);
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
  @Put(':id')
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
    summary: 'Activate/Deactivate a hotel',
    description: 'Toggle the active status of a hotel (only for owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    description: 'Hotel status updated successfully',
  })
  @Patch(':id/toggle-active')
  async toggleHotelActive(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.hotelsService.toggleHotelActive(user, id, isActive);
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

  /* 
  // Uncomment when ready to implement
  @ApiOperation({
    summary: 'Restore a deleted hotel',
    description: 'Restore a previously deleted hotel (only for admin)',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    description: 'Hotel restored successfully',
  })
  @Admin()
  @Patch(':id/restore')
  async restoreHotel(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.hotelsService.restoreHotel(user, id);
  }
  */
}
