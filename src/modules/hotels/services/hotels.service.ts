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

import { BaseService, FindManyOptions } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { MinioStorageService } from '@/modules/minio-storage/minio-storage.service';
import { RoomsService } from '@/modules/rooms/services/rooms.service';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateHotelDto, HotelQueryDtoForAdmin, UpdateHotelDto } from '../dtos/hotel.dto';
import { Hotel } from '../schemas/hotel.schema';

@Injectable()
export class HotelsService extends BaseService<Hotel> {
  constructor(
    @InjectModel(Hotel.name) protected readonly model: Model<Hotel>,
    private readonly minioStorageService: MinioStorageService,
    @Inject(forwardRef(() => RoomsService)) private readonly roomsService: RoomsService,
  ) {
    const logger = new Logger(HotelsService.name);
    super(model, logger);
  }

  async searchHotelsWithAvailability(
    queryDto: HotelQueryDtoForAdmin,
    checkIn: Date,
    checkOut: Date,
  ) {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    // === BƯỚC 1: XÂY DỰNG ĐIỀU KIỆN LỌC BAN ĐẦU TRÊN COLLECTION HOTELS ===
    const initialHotelMatch: any = {
      isActive: true, // Mặc định chỉ lấy khách sạn đang hoạt động
    };

    const aggregationPipeline: any[] = [
      // === GIAI ĐOẠN 1: LỌC CÁC KHÁCH SẠN THỎA MÃN ĐIỀU KIỆN CƠ BẢN ===
      {
        $match: initialHotelMatch,
      },

      // === GIAI ĐOẠN 2: "JOIN" VÀ LỌC SƠ BỘ TRÊN CÁC PHÒNG ĐANG HOẠT ĐỘNG ===
      {
        $lookup: {
          from: 'rooms',
          let: { hotel_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$hotel', '$$hotel_id'] },
                isActive: true, // Chỉ lấy các loại phòng đang được mở bán
              },
            },
          ],
          as: 'roomDetails',
        },
      },

      // === GIAI ĐOẠN 3: TÍNH TOÁN SỐ LƯỢNG PHÒNG TRỐNG (LOGIC CỐT LÕI) ===
      {
        $addFields: {
          totalRooms: { $sum: '$roomDetails.maxQuantity' },
        },
      },
      {
        $lookup: {
          from: 'bookings',
          let: { hotel_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$hotel', '$$hotel_id'] },
                status: { $ne: 'CANCELLED' },
                checkIn: { $lt: endDate },
                checkOut: { $gt: startDate },
              },
            },
            // Nhóm theo room để đếm số booking per room
            {
              $group: {
                _id: '$room',
                bookingCount: { $sum: 1 },
              },
            },
          ],
          as: 'bookedRoomsInfo',
        },
      },
      {
        $addFields: {
          // Tính tổng số phòng đã được đặt
          totalBookedRooms: { $sum: '$bookedRoomsInfo.bookingCount' },
          availableRooms: {
            $subtract: ['$totalRooms', { $ifNull: [{ $sum: '$bookedRoomsInfo.bookingCount' }, 0] }],
          },
        },
      },

      // === GIAI ĐOẠN 5: ĐỊNH HÌNH KẾT QUẢ CUỐI CÙNG ===
      {
        $project: {
          roomDetails: 0,
          bookedRoomsInfo: 0,
          __v: 0,
        },
      },
    ];

    const hotelsWithAvailability = await this.model.aggregate(aggregationPipeline);

    return hotelsWithAvailability;
  }

  async getHotelById(id: string): Promise<Hotel> {
    const hotel = await this.findOne({ _id: id });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${id} not found`);
    }
    return hotel;
  }

  async getHotelsByOwnerId(ownerId: string): Promise<Hotel[]> {
    return this.model.find({ owner: ownerId, deleteTimestamp: null }).lean().exec();
  }

  async createHotel(
    user: User,
    createHotelDto: CreateHotelDto,
    images: Express.Multer.File[],
  ): Promise<Hotel> {
    const id = randomUUID();
    const imageFileNames = (
      await Promise.all(
        images.map((image) => this.minioStorageService.uploadFile(image, true, `hotels/${id}`)),
      )
    ).map((image) => image.fileName);

    return this.createOne({
      ...createHotelDto,
      _id: id,
      owner: user,
      images: imageFileNames,
    });
  }

  async deleteHotel(user: User, hotelId: string): Promise<void> {
    const hotel = await this.findOne({ _id: hotelId });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    // Kiểm tra quyền xóa
    if (hotel.owner._id.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this hotel');
    }

    await this.softDelete({ _id: hotelId }, user);
  }

  protected async preUpdate(
    updateDto: UpdateHotelDto,
    _oldRecords: Hotel[],
    _filter?: RootFilterQuery<Hotel> | undefined,
    _currentUser?: User,
  ): Promise<Partial<Hotel>> {
    if (_oldRecords.length === 0) {
      throw new NotFoundException('Hotel not found for update');
    }

    const oldHotel = _oldRecords[0];
    if (
      oldHotel.owner._id.toString() !== _currentUser?._id.toString() &&
      _currentUser?.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('You do not have permission to update this hotel');
    }

    const newImages = updateDto.newImages as unknown as Express.Multer.File[];

    for (const imageToDelete of updateDto.imagesToDelete) {
      if (!oldHotel.images.includes(imageToDelete)) {
        throw new NotFoundException(`Image '${imageToDelete}' is not found.`);
      }
    }

    await Promise.all(
      updateDto.imagesToDelete.map((image) => this.minioStorageService.deleteFile(image)),
    );

    const newImageFileNames = (
      await Promise.all(
        (newImages ?? []).map((image) =>
          this.minioStorageService.uploadFile(image, true, `hotels/${oldHotel._id}`),
        ),
      )
    ).map((image) => image.fileName);

    return {
      ...updateDto,
      images: oldHotel.images
        .filter((image) => !updateDto.imagesToDelete.includes(image))
        .concat(newImageFileNames),
      updateTimestamp: new Date(),
    };
  }

  protected async preFind(
    options: FindManyOptions<Hotel>,
    currentUser?: User,
  ): Promise<FindManyOptions<Hotel>> {
    const findOptions = await super.preFind(options, currentUser);
    const hotelQueryDto = findOptions.queryDto as HotelQueryDtoForAdmin;

    // logic and filter for fields base on HotelQueryDtoForAdmin
    findOptions.filter = {
      ...findOptions.filter,
      ...(hotelQueryDto.name && { name: { $regex: hotelQueryDto.name, $options: 'i' } }),
      ...(hotelQueryDto.id && { _id: hotelQueryDto.id }),
      ...(hotelQueryDto.address && { address: { $regex: hotelQueryDto.address, $options: 'i' } }),
      ...(hotelQueryDto.minRating && { rating: { $gte: hotelQueryDto.minRating } }),
      ...(hotelQueryDto.services &&
        hotelQueryDto.services.length > 0 && {
          services: { $in: hotelQueryDto.services.map((service) => new RegExp(service, 'i')) },
        }),
      ...(hotelQueryDto.cancelPolicy && { cancelPolicy: hotelQueryDto.cancelPolicy }),
    };

    if (hotelQueryDto.minOccupancy) {
      const hotelIds = await this.roomsService.findHotelIdsByRoomOccupancy(
        hotelQueryDto.minOccupancy,
      );
      findOptions.filter._id = { $in: hotelIds };
    }

    if (hotelQueryDto.searchTerm) {
      findOptions.filter.$or = [
        { name: { $regex: hotelQueryDto.searchTerm, $options: 'i' } },
        { address: { $regex: hotelQueryDto.searchTerm, $options: 'i' } },
      ];
    }

    // filter by priceHotel
    if (hotelQueryDto.minPrice || hotelQueryDto.maxPrice) {
      const priceFilter: any = {};

      if (hotelQueryDto.minPrice) {
        priceFilter.$gte = hotelQueryDto.minPrice;
      }

      if (hotelQueryDto.maxPrice) {
        priceFilter.$lte = hotelQueryDto.maxPrice;
      }

      findOptions.filter = {
        ...findOptions.filter,
        priceHotel: priceFilter,
      };
    }

    // if role is hotel owner,filter hotel by owner
    if (currentUser?.role === Role.HOTEL_OWNER) {
      findOptions.filter = {
        ...findOptions.filter,
        owner: currentUser._id,
      };
    }

    // If the query is made by an admin and includes ownerId, filter by ownerId
    // only admin can query by ownerId
    if (hotelQueryDto.ownerId && currentUser?.role === Role.ADMIN) {
      // If admin is querying by ownerId, apply that filter
      findOptions.filter = {
        ...findOptions.filter,
        owner: hotelQueryDto.ownerId,
      };
    }

    // If the query is made by an admin and includes isActive, filter by deleteTimestamp
    if (hotelQueryDto.isActive) {
      switch (hotelQueryDto.isActive) {
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
      }
    }

    return findOptions;
  }
}
