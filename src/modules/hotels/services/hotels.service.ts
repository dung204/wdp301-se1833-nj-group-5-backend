import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { QueryDto } from '@/base/dtos';
import { BaseService } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateHotelDto, HotelQueryDto, UpdateHotelDto } from '../dtos/hotel.dto';
import { Hotel } from '../schemas/hotel.schema';

@Injectable()
export class HotelsService extends BaseService<Hotel> {
  constructor(@InjectModel(Hotel.name) protected readonly model: Model<Hotel>) {
    const logger = new Logger(HotelsService.name);
    super(model, logger);
  }

  async getAllHotels() {
    return this.find({ filter: { isActive: true } });
  }

  async getHotelById(id: string): Promise<Hotel> {
    const hotel = await this.findOne({ _id: id, isActive: true });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${id} not found`);
    }
    return hotel;
  }

  async createHotel(user: User, createHotelDto: CreateHotelDto): Promise<Hotel> {
    return this.createOne({
      ...createHotelDto,
      owner: user._id,
    });
  }

  async updateHotel(user: User, hotelId: string, updateHotelDto: UpdateHotelDto) {
    const hotel = await this.findOne({ _id: hotelId });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    // Kiểm tra xem người dùng có phải chủ sở hữu hoặc admin không
    if (hotel.owner.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this hotel');
    }

    return this.update(updateHotelDto, { _id: hotelId });
  }

  async findHotels(options: {
    queryDto: QueryDto;
    hotelQueryDto?: HotelQueryDto;
    filter?: Record<string, unknown>;
  }) {
    const { queryDto, hotelQueryDto = {}, filter = {} } = options;
    const filters: Record<string, any> = { ...filter };

    // Xử lý các filter từ HotelQueryDto
    if (hotelQueryDto.name) {
      filters.name = { $regex: hotelQueryDto.name, $options: 'i' };
    }

    if (hotelQueryDto.id) {
      filters._id = hotelQueryDto.id;
    }

    if (hotelQueryDto.address) {
      filters.address = { $regex: hotelQueryDto.address, $options: 'i' };
    }

    if (hotelQueryDto.minRating) {
      filters.rating = { $gte: hotelQueryDto.minRating };
    }

    // Cũng có thể áp dụng tìm kiếm theo services tương tự
    if (hotelQueryDto.services && hotelQueryDto.services.length > 0) {
      // Tìm kiếm các khách sạn có ít nhất một dịch vụ khớp với từ khóa tìm kiếm
      const serviceRegexes = hotelQueryDto.services.map((service) => new RegExp(service, 'i'));

      filters.services = { $in: serviceRegexes }; // $in: phù hợp với bất kỳ giá trị nào trong mảng
    }

    // return this.postFind(data, { queryDto, filter, projection: {}, ...queryDto });
    return this.find({
      queryDto,
      filter: filters,
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

  async getHotelsByOwner(ownerId: string): Promise<Hotel[]> {
    const response = await this.find({
      filter: { owner: ownerId },
    });
    return response.data;
  }

  async toggleHotelActive(user: User, hotelId: string, isActive: boolean): Promise<Hotel> {
    const hotel = await this.findOne({ _id: hotelId });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    // Kiểm tra quyền cập nhật
    if (hotel.owner.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this hotel');
    }

    const hotelUpdated = await this.update({ isActive } as Partial<Hotel>, {
      _id: hotelId,
    });

    if (!hotelUpdated || hotelUpdated.length === 0) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }
    return hotelUpdated[0];
  }
}
