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

  async createHotel(user: User, createHotelDto: CreateHotelDto): Promise<Hotel> {
    return this.createOne({
      ...createHotelDto,
      owner: user,
    });
  }

  // protected async preSoftDelete(_filter?: RootFilterQuery<Hotel> | undefined, _currentUser?: User): Promise<void> {
  //   if (!_filter || Object.keys(_filter).length === 0) {
  //     throw new NotFoundException('No hotel found to delete');
  //   }

  //   const { _id } = _filter as { _id: string };
  //   const hotel = await this.getHotelById(_id);
  //   if (!hotel) {
  //     throw new NotFoundException(`Hotel with ID ${_id} not found`);
  //   }

  //   if(hotel.owner.toString() !== _currentUser?._id.toString() && _currentUser?.role !== Role.ADMIN) {
  //     throw new ForbiddenException('You do not have permission to delete this hotel');
  //   }
  // }

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

  protected preFind(options: FindManyOptions<Hotel>, currentUser?: User): FindManyOptions<Hotel> {
    const findOptions = super.preFind(options, currentUser);
    const hotelQueryDto = findOptions.queryDto as HotelQueryDtoForAdmin;

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
    };

    if (currentUser?.role === Role.HOTEL_OWNER) {
      findOptions.filter = {
        ...findOptions.filter,
        owner: currentUser._id,
      };
    }

    if (hotelQueryDto.ownerId && currentUser?.role === Role.ADMIN) {
      // If admin is querying by ownerId, apply that filter
      findOptions.filter = {
        ...findOptions.filter,
        owner: hotelQueryDto.ownerId,
      };
    }

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
