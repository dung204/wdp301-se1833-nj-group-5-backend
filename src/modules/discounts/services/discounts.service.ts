import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService, FindManyOptions } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateDiscountDto, DiscountQueryDto, UpdateDiscountDto } from '../dtos/discount.dto';
import { Discount } from '../schemas/discount.schema';

@Injectable()
export class DiscountsService extends BaseService<Discount> {
  constructor(
    @InjectModel(Discount.name) protected readonly model: Model<Discount>,
    private readonly hotelService: HotelsService,
  ) {
    const logger = new Logger(DiscountsService.name);
    super(model, logger);
  }

  async getDiscountById(id: string): Promise<Discount> {
    const discount = await this.findOne({ _id: id });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }
    return discount;
  }

  // get discounts by array of ids
  async getDiscountsByIds(ids: string[]): Promise<Discount[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const discounts = await this.find({
      filter: { _id: { $in: ids } },
    });

    return discounts.data;
  }

  async createDiscount(user: User, createDiscountDto: CreateDiscountDto): Promise<Discount> {
    // Only admin can create discounts
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can create discounts');
    }

    const hotels = [];

    if (createDiscountDto.applicableHotels && createDiscountDto.applicableHotels.length > 0) {
      for (let i = 0; i < createDiscountDto.applicableHotels.length; i++) {
        const hotel = await this.hotelService.getHotelById(createDiscountDto.applicableHotels[i]);
        if (!hotel) {
          throw new NotFoundException(
            `Hotel with ID ${createDiscountDto.applicableHotels[i]} not found`,
          );
        }

        hotels.push(hotel);
      }
    }

    return this.createOne({
      ...createDiscountDto,
      usageCount: 0, // Initialize usage count
      applicableHotels: hotels,
    });
  }

  async decreaseDiscountUsage(discountId: string): Promise<Discount> {
    const discount = await this.findOne({ _id: discountId });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${discountId} not found`);
    }

    // if usageCount is already 0, do not decrease it and return error
    if (discount.usageCount <= 0) {
      throw new ForbiddenException('Discount usage count is already at 0');
    }

    await this.update(
      {
        usageCount: discount.usageCount > 0 ? discount.usageCount - 1 : 0, // Ensure usage count doesn't go below 0
      },
      {
        _id: discountId,
      },
    );

    return discount;
  }

  async updateDiscount(user: User, discountId: string, updateDiscountDto: UpdateDiscountDto) {
    // Only admin can update discounts
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can update discounts');
    }

    const discount = await this.findOne({ _id: discountId });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${discountId} not found`);
    }

    const hotels = [] as Hotel[];
    if (updateDiscountDto.applicableHotels && updateDiscountDto.applicableHotels.length > 0) {
      for (let i = 0; i < updateDiscountDto.applicableHotels.length; i++) {
        const hotel = await this.hotelService.getHotelById(updateDiscountDto.applicableHotels[i]);

        if (!hotel) {
          throw new NotFoundException(
            `Hotel with ID ${updateDiscountDto.applicableHotels[i]} not found`,
          );
        }

        hotels.push();
      }
    }

    return this.update(
      {
        ...updateDiscountDto,
        applicableHotels: [...hotels],
      },
      { _id: discountId },
    );
  }

  // async findDiscounts(options: {
  //   queryDto: QueryDto;
  //   discountQueryDto?: DiscountQueryDto;
  //   filter?: Record<string, unknown>;
  // }) {
  //   const { queryDto, discountQueryDto = {}, filter = {} } = options;
  //   const filters: Record<string, any> = { ...filter };

  //   // Process filters from DiscountQueryDto
  //   if (discountQueryDto.minAmount) {
  //     filters.amount = { $gte: discountQueryDto.minAmount };
  //   }

  //   if (discountQueryDto.id) {
  //     filters._id = discountQueryDto.id;
  //   }

  //   if (discountQueryDto.state) {
  //     filters.state = discountQueryDto.state;
  //   }

  //   if (discountQueryDto.hotelId) {
  //     filters.applicableHotels = discountQueryDto.hotelId;
  //   }

  //   // // Add filter for non-expired discounts
  //   // filters.expiredTimestamp = { $gt: new Date() };

  //   return this.find({
  //     queryDto,
  //     filter: filters,
  //   });
  // }

  async deleteDiscount(user: User, discountId: string): Promise<void> {
    // Only admin can delete discounts
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can delete discounts');
    }

    const discount = await this.findOne({ _id: discountId });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${discountId} not found`);
    }

    await this.softDelete({ _id: discountId });
  }

  async incrementUsageCount(discountId: string): Promise<void> {
    const discount = await this.findOne({ _id: discountId });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${discountId} not found`);
    }

    await this.model.updateOne({ _id: discountId }, { $inc: { usageCount: 1 } });
  }

  protected async preFind(
    options: FindManyOptions<Discount>,
    _currentUser?: User,
  ): Promise<FindManyOptions<Discount>> {
    const findOptions = await super.preFind(options, _currentUser);
    if (findOptions.queryDto) {
      const discountQueryDto = findOptions.queryDto as DiscountQueryDto;

      findOptions.filter = {
        ...findOptions.filter,
        ...(discountQueryDto.id && { _id: discountQueryDto.id }),
        ...(discountQueryDto.minAmount && { amount: { $gte: discountQueryDto.minAmount } }),
        ...(discountQueryDto.state && { state: discountQueryDto.state }),
        ...(discountQueryDto.hotelId &&
          discountQueryDto.hotelId.length > 0 && {
            applicableHotels: { $in: discountQueryDto.hotelId },
          }),
      };
    }

    return findOptions;
  }
}
