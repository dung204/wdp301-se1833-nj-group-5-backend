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
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateRoomDto, RoomQueryDto, RoomResponseDto, UpdateRoomDto } from '../dtos/room.dto';
import { RoomsService } from '../services/rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiOperation({
    summary: 'Retrieve all active rooms',
    description: 'Get a list of all active rooms',
  })
  @ApiSuccessResponse({
    schema: RoomResponseDto,
    isArray: true,
    description: 'Rooms retrieved successfully',
  })
  @Public()
  @Get()
  async getAllRooms() {
    return this.roomsService.getAllRooms();
  }

  @ApiOperation({
    summary: 'Search and filter rooms',
    description: 'Search rooms with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: RoomResponseDto,
    isArray: true,
    description: 'Rooms retrieved successfully',
  })
  @Public()
  @Get('/search')
  async searchRooms(@Query() queryDto: QueryDto, @Query() roomQueryDto: RoomQueryDto) {
    return this.roomsService.findRooms({ queryDto, roomQueryDto });
  }

  @ApiOperation({
    summary: 'Get rooms by hotel',
    description: 'Retrieve all rooms for a specific hotel',
  })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiSuccessResponse({
    schema: RoomResponseDto,
    isArray: true,
    description: 'Hotel rooms retrieved successfully',
  })
  @Public()
  @Get('/hotel/:hotelId')
  async getRoomsByHotel(@Param('hotelId') hotelId: string) {
    return this.roomsService.getRoomsByHotel(hotelId);
  }

  @ApiOperation({
    summary: 'Get a room by ID',
    description: 'Retrieve detailed information about a specific room',
  })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiSuccessResponse({
    schema: RoomResponseDto,
    description: 'Room retrieved successfully',
  })
  @Public()
  @Get(':id')
  async getRoomById(@Param('id') id: string) {
    return this.roomsService.getRoomById(id);
  }

  @ApiOperation({
    summary: 'Create a new room',
    description: 'Create a new room in a hotel (only for hotel owner or admin)',
  })
  @ApiSuccessResponse({
    schema: RoomResponseDto,
    description: 'Room created successfully',
  })
  @Post()
  async createRoom(@CurrentUser() user: User, @Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.createRoom(user, createRoomDto);
  }

  @ApiOperation({
    summary: 'Update a room',
    description: 'Update a room (only for hotel owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiSuccessResponse({
    schema: RoomResponseDto,
    description: 'Room updated successfully',
  })
  @Put(':id')
  async updateRoom(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.updateRoom(user, id, updateRoomDto);
  }

  @ApiOperation({
    summary: 'Delete a room',
    description: 'Soft delete a room (only for hotel owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiNoContentResponse({
    description: 'Room deleted successfully',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRoom(@CurrentUser() user: User, @Param('id') id: string) {
    return this.roomsService.deleteRoom(user, id);
  }

  @ApiOperation({
    summary: 'Activate/Deactivate a room',
    description: 'Toggle the active status of a room (only for hotel owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiSuccessResponse({
    schema: RoomResponseDto,
    description: 'Room status updated successfully',
  })
  @Patch(':id/toggle-active')
  async toggleRoomActive(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.roomsService.toggleRoomActive(user, id, isActive);
  }
}
