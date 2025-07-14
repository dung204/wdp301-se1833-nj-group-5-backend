import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model, RootFilterQuery } from 'mongoose';

import { ImageDto } from '@/base/dtos';
import { BaseService, FindManyOptions } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { BookingsService } from '@/modules/bookings/services/bookings.service';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { MinioStorageService } from '@/modules/minio-storage/minio-storage.service';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateRoomDto, RoomQueryAdminDto, UpdateRoomDto } from '../dtos/room.dto';
import { Room } from '../schemas/room.schema';

@Injectable()
export class RoomsService extends BaseService<Room> {
  constructor(
    @InjectModel(Room.name) protected readonly model: Model<Room>,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingService: BookingsService,
    @Inject(forwardRef(() => HotelsService)) private readonly hotelsService: HotelsService,
    private readonly minioStorageService: MinioStorageService,
  ) {
    const logger = new Logger(RoomsService.name);
    super(model, logger);
  }

  async getRoomsByFilterAndSearch(roomQueryDto: RoomQueryAdminDto) {
    const findOptions: FindManyOptions<Room> = {
      queryDto: roomQueryDto,
      filter: { deleteTimestamp: null }, // Only active rooms
    };
    // list rooms with pagination, sorting and filtering options
    let response = await this.find(findOptions);

    if (roomQueryDto.hotel && roomQueryDto.checkIn && roomQueryDto.checkOut) {
      // filter booked rooms
      const bookedRoom = await this.bookingService.bookedCountByHotel(
        roomQueryDto.hotel,
        roomQueryDto.checkIn,
        roomQueryDto.checkOut,
      );

      const bookedMap = new Map(
        bookedRoom.map((item) => [item.roomId.toString(), item.bookedCount]),
      );

      // Thêm thông tin về số lượng phòng trống vào kết quả cuối cùng
      const resultsWithAvailability = response.data.map((roomType) => {
        const booked = bookedMap.get(roomType._id.toString()) || 0; // Lấy số phòng đã đặt, nếu không có thì là 0
        const available = roomType.maxQuantity - booked;

        return {
          ...roomType,
          availability: {
            total: roomType.maxQuantity,
            booked: booked,
            available: available > 0 ? available : 0, // Đảm bảo số phòng trống không bị âm
          },
          isSoldOut: available <= 0, // Thêm một cờ để biết đã hết phòng hay chưa
        };
      });

      response = {
        ...response,
        data: resultsWithAvailability,
      };
    }
    return response;
  }

  async getRoomById(id: string): Promise<Room> {
    const room = await this.findOne({ _id: id, isActive: true });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  async createRoom(
    user: User,
    createRoomDto: CreateRoomDto,
    images: Express.Multer.File[],
  ): Promise<Room> {
    // Check if hotel exists and user has permission
    const hotel = await this.hotelsService.getHotelById(createRoomDto.hotel);
    if (hotel.owner._id.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to create rooms for this hotel');
    }

    const id = randomUUID();
    const imageFileNames = (
      await Promise.all(
        images.map((image) => this.minioStorageService.uploadFile(image, true, `hotels/${id}`)),
      )
    ).map((image) => image.fileName);

    return this.createOne({
      ...createRoomDto,
      _id: id,
      hotel: hotel,
      images: imageFileNames,
    });
  }

  async deleteRoom(user: User, roomId: string): Promise<void> {
    const room = await this.findOne({ _id: roomId });
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    // Get hotel to check permissions
    const hotelId = room.hotel?._id;
    const hotel = await this.hotelsService.getHotelById(hotelId);
    if (hotel.owner._id.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this room');
    }

    await this.softDelete({ _id: roomId }, user);
  }

  async getRoomsByHotel(hotelId: string): Promise<Room[]> {
    const response = await this.find({
      filter: { hotel: hotelId, isActive: true },
    });
    return response.data;
  }

  protected async preUpdate(
    updateDto: UpdateRoomDto,
    oldRooms: Room[],
    _filter?: RootFilterQuery<Room>,
    currentUser?: User,
  ): Promise<Partial<Room>> {
    // Get hotel to check permissions
    const hotel = await this.hotelsService.getHotelById(oldRooms[0].hotel?._id.toString());
    if (
      hotel.owner._id.toString() !== currentUser?._id.toString() &&
      currentUser?.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('You do not have permission to update this room');
    }

    const newImages = updateDto.newImages as unknown as Express.Multer.File[];

    for (const imageToDelete of updateDto.imagesToDelete) {
      if (!oldRooms[0].images.includes(imageToDelete)) {
        throw new NotFoundException(`Image '${imageToDelete}' is not found.`);
      }
    }

    await Promise.all(
      updateDto.imagesToDelete.map((image) => this.minioStorageService.deleteFile(image)),
    );

    const newImageFileNames = (
      await Promise.all(
        (newImages ?? []).map((image) =>
          this.minioStorageService.uploadFile(image, true, `rooms/${oldRooms[0]._id}`),
        ),
      )
    ).map((image) => image.fileName);

    return {
      ...updateDto,
      images: oldRooms[0].images
        .filter((image) => !updateDto.imagesToDelete.includes(image))
        .concat(newImageFileNames),
    };
  }

  protected async preFind(
    options: FindManyOptions<Room>,
    currentUser?: User,
  ): Promise<FindManyOptions<Room>> {
    const findOptions = await super.preFind(options, currentUser);
    const roomQueryDto = findOptions.queryDto as RoomQueryAdminDto;

    findOptions.filter = {
      ...findOptions.filter,
      ...(roomQueryDto.name && { name: { $regex: roomQueryDto.name, $options: 'i' } }),
      ...(roomQueryDto.id && { _id: roomQueryDto.id }),
      ...(roomQueryDto.hotel && { hotel: roomQueryDto.hotel }),
      ...(roomQueryDto.minRate && { rate: { $gte: roomQueryDto.minRate } }),
      ...(roomQueryDto.maxRate && { rate: { $lte: roomQueryDto.maxRate } }),
      ...(roomQueryDto.minOccupancy && { occupancy: { $gte: roomQueryDto.minOccupancy } }),
      ...(roomQueryDto.services &&
        roomQueryDto.services.length > 0 && {
          services: { $in: roomQueryDto.services.map((service) => new RegExp(service, 'i')) },
        }),
    };

    // if role is hotel owner -> only show rooms in their hotel and base on hotel -> WIP
    if (currentUser?.role === Role.HOTEL_OWNER) {
      const hotel = await this.hotelsService.getHotelsByOwnerId(currentUser._id);
      findOptions.filter = {
        ...findOptions.filter,
        hotel: {
          $in: hotel.map((h) => h._id),
        },
      };
    }

    // Default to only active rooms
    // if role is admin or hotel owner, we can show all rooms
    if (
      roomQueryDto.isActive &&
      (currentUser?.role === Role.ADMIN || currentUser?.role === Role.HOTEL_OWNER)
    ) {
      switch (roomQueryDto.isActive) {
        case 'true':
          findOptions.filter = {
            ...findOptions.filter,
            deleteTimestamp: null,
          };
          break;
        case 'false':
          findOptions.filter = {
            ...findOptions.filter,
            deleteTimestamp: { $ne: null },
          };
          break;
        // case 'all' - no filter needed
      }
    }

    return findOptions;
  }

  protected async postFind(data: Room[], options: FindManyOptions<Room>, _currentUser?: User) {
    const result = await super.postFind(data, options, _currentUser);

    const mappedRooms: Room[] = [];

    for (const room of result.data) {
      const roomImages: ImageDto[] = [];
      for (const image of room.images) {
        const imageUrl = await this.minioStorageService.getFileUrl(image, true);

        if (imageUrl) {
          roomImages.push({
            fileName: image,
            url: imageUrl,
          });
        }
      }

      room.images = roomImages as any;
      mappedRooms.push(room);
    }

    return {
      data: mappedRooms,
      metadata: result.metadata,
    };
  }

  protected async postFindOne(
    room: Room | null,
    _filter: RootFilterQuery<Room>,
    _currentUser?: User,
  ): Promise<Room | null> {
    if (!room) return room;

    const roomImages: ImageDto[] = [];
    for (const image of room.images) {
      const imageUrl = await this.minioStorageService.getFileUrl(image, true);

      if (imageUrl) {
        roomImages.push({
          fileName: image,
          url: imageUrl,
        });
      }
    }

    room.images = roomImages as any;
    return room;
  }

  // In your hotels service
  async findHotelIdsByRoomOccupancy(minOccupancy: number) {
    // First find rooms with the required occupancy
    const roomsWithOccupancy = await this.model
      .find({ occupancy: { $gte: minOccupancy }, isActive: true })
      .distinct('hotel')
      .exec();

    return roomsWithOccupancy as unknown as string[];
  }
}
