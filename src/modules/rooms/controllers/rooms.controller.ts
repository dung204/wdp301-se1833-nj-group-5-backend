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
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import {
  CreateRoomDto,
  RoomQueryAdminDto,
  RoomQueryDto,
  RoomResponseDto,
  UpdateRoomDto,
} from '@/modules/rooms/dtos/room.dto';
import { RoomsService } from '@/modules/rooms/services/rooms.service';
import { User } from '@/modules/users/schemas/user.schema';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiOperation({
    summary: 'Search filter rooms, get all rooms',
    description: 'Search rooms with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: RoomResponseDto,
    isArray: true,
    description: 'Rooms retrieved successfully',
  })
  @Public()
  @Get('/')
  async searchRooms(@Query() queryDto: QueryDto, @Query() roomQueryDto: RoomQueryDto) {
    return this.roomsService.findRooms({
      queryDto,
      roomQueryDto,
      filter: { deleteTimestamp: null }, // Only active rooms
    });
  }

  @ApiOperation({
    summary: 'Search filter rooms, get all rooms',
    description: 'Search rooms with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: RoomResponseDto,
    isArray: true,
    description: 'Rooms retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Get('/admin')
  async searchRoomAdmin(
    @CurrentUser() user: User,
    @Query() queryDto: QueryDto,
    @Query() roomQueryDto: RoomQueryAdminDto,
  ) {
    //
    const filter: Record<string, any> = {};

    // Add active/deleted filter based on isActive query param
    if (roomQueryDto.isActive) {
      switch (roomQueryDto.isActive) {
        case 'true':
          filter.deleteTimestamp = null;
          break;
        case 'false':
          filter.deleteTimestamp = { $ne: null };
          break;
        // case 'all' - no filter needed
      }
    }

    return this.roomsService.findRooms({ queryDto, roomQueryDto, filter });
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
  @Patch(':id')
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
    summary: 'Restore a room',
    description: 'Restore a room (only for hotel owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiNoContentResponse({
    description: 'Room restore successfully',
  })
  @Patch('restore/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async restoreRoom(@Param('id') id: string) {
    return this.roomsService.restore({
      _id: id,
    });
  }
}
