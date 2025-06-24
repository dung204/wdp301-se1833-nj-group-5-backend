import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';

import { BaseService, FindManyOptions } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateHotelDto, HotelQueryDtoForAdmin, UpdateHotelDto } from '../dtos/hotel.dto';
import { Hotel } from '../schemas/hotel.schema';

@Injectable()
export class HotelsService extends BaseService<Hotel> {
  constructor(@InjectModel(Hotel.name) protected readonly model: Model<Hotel>) {
    const logger = new Logger(HotelsService.name);
    super(model, logger);
  }

  async getHotelById(id: string): Promise<Hotel> {
    const hotel = await this.findOne({ _id: id });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${id} not found`);
    }
    return hotel;
  }

  async getHotelsByOwnerId(ownerId: string): Promise<Hotel[]> {
    const hotels = await this.model
      .find({ filter: { owner: ownerId, deleteTimestamp: null } })
      .lean()
      .exec();
    if (!hotels || hotels.length === 0) {
      throw new NotFoundException(`No hotels found for owner with ID ${ownerId}`);
    }
    return hotels;
  }

  async createHotel(user: User, createHotelDto: CreateHotelDto): Promise<Hotel> {
    return this.createOne({
      ...createHotelDto,
      owner: user,
    });
  }

  async deleteHotel(user: User, hotelId: string): Promise<void> {
    const hotel = await this.findOne({ _id: hotelId });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    // Kiểm tra quyền xóa
    if (hotel.owner.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this hotel');
    }

    await this.softDelete({ _id: hotelId });
  }

  protected preUpdate(
    updateDto: UpdateHotelDto,
    _oldRecords: Hotel[],
    _filter?: RootFilterQuery<Hotel> | undefined,
    _currentUser?: User,
  ): Partial<Hotel> {
    if (_oldRecords.length === 0) {
      throw new NotFoundException('Hotel not found for update');
    }

    const oldHotel = _oldRecords[0];
    if (
      oldHotel.owner.toString() !== _currentUser?._id.toString() &&
      _currentUser?.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('You do not have permission to update this hotel');
    }

    return {
      ...updateDto,
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
