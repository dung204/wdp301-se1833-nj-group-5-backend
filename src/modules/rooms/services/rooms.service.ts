import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { QueryDto } from '@/base/dtos';
import { BaseService } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateRoomDto, RoomQueryDto, UpdateRoomDto } from '../dtos/room.dto';
import { Room } from '../schemas/room.schema';

@Injectable()
export class RoomsService extends BaseService<Room> {
  constructor(
    @InjectModel(Room.name) protected readonly model: Model<Room>,
    private readonly hotelsService: HotelsService,
  ) {
    const logger = new Logger(RoomsService.name);
    super(model, logger);
  }

  async getAllRooms() {
    return this.find({ filter: { isActive: true } });
  }

  async getRoomById(id: string): Promise<Room> {
    const room = await this.findOne({ _id: id, isActive: true });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  async createRoom(user: User, createRoomDto: CreateRoomDto): Promise<Room> {
    // Check if hotel exists and user has permission
    const hotel = await this.hotelsService.getHotelById(createRoomDto.hotel);
    if (hotel.owner.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to create rooms for this hotel');
    }

    return this.createOne(createRoomDto);
  }

  async updateRoom(user: User, roomId: string, updateRoomDto: UpdateRoomDto) {
    const room = await this.findOne({ _id: roomId });
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    // Get hotel to check permissions
    const hotel = await this.hotelsService.getHotelById(room.hotel.toString());
    if (hotel.owner.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this room');
    }

    return this.update(updateRoomDto, { _id: roomId });
  }

  async findRooms(options: {
    queryDto: QueryDto;
    roomQueryDto?: RoomQueryDto;
    filter?: Record<string, unknown>;
  }) {
    const { queryDto, roomQueryDto = {}, filter = {} } = options;
    const filters: Record<string, any> = { ...filter };

    // Process filters from RoomQueryDto
    if (roomQueryDto.name) {
      filters.name = { $regex: roomQueryDto.name, $options: 'i' };
    }

    if (roomQueryDto.hotel) {
      filters.hotel = roomQueryDto.hotel;
    }

    if (roomQueryDto.minRate) {
      filters.rate = { $gte: roomQueryDto.minRate };
    }

    if (roomQueryDto.maxRate) {
      filters.rate = { ...filters.rate, $lte: roomQueryDto.maxRate };
    }

    if (roomQueryDto.minOccupancy) {
      filters.occupancy = { $gte: roomQueryDto.minOccupancy };
    }

    if (roomQueryDto.services && roomQueryDto.services.length > 0) {
      const serviceRegexes = roomQueryDto.services.map((service) => new RegExp(service, 'i'));
      filters.services = { $in: serviceRegexes };
    }

    // Default to only active rooms
    if (filters.isActive === undefined) {
      filters.isActive = true;
    }

    return this.find({
      queryDto,
      filter: filters,
    });
  }

  async deleteRoom(user: User, roomId: string): Promise<void> {
    const room = await this.findOne({ _id: roomId });
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    // Get hotel to check permissions
    const hotel = await this.hotelsService.getHotelById(room.hotel.toString());
    if (hotel.owner.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this room');
    }

    await this.softDelete({ _id: roomId });
  }

  async getRoomsByHotel(hotelId: string): Promise<Room[]> {
    const response = await this.find({
      filter: { hotel: hotelId, isActive: true },
    });
    return response.data;
  }

  async toggleRoomActive(user: User, roomId: string, isActive: boolean): Promise<Room> {
    const room = await this.findOne({ _id: roomId });
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    // Get hotel to check permissions
    const hotel = await this.hotelsService.getHotelById(room.hotel.toString());
    if (hotel.owner.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this room');
    }

    const roomUpdated = await this.update({ isActive } as Partial<Room>, {
      _id: roomId,
    });

    if (!roomUpdated || roomUpdated.length === 0) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }
    return roomUpdated[0];
  }
}
