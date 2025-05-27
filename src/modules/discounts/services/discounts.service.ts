import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { QueryDto } from '@/base/dtos';
import { BaseService } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateDiscountDto, DiscountQueryDto, UpdateDiscountDto } from '../dtos/discount.dto';
import { DiscountState } from '../enums/discount.enum';
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

  async getAllDiscounts() {
    return this.find();
  }

  async getDiscountById(id: string): Promise<Discount> {
    const discount = await this.findOne({ _id: id });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }
    return discount;
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

  async findDiscounts(options: {
    queryDto: QueryDto;
    discountQueryDto?: DiscountQueryDto;
    filter?: Record<string, unknown>;
  }) {
    const { queryDto, discountQueryDto = {}, filter = {} } = options;
    const filters: Record<string, any> = { ...filter };

    // Process filters from DiscountQueryDto
    if (discountQueryDto.minAmount) {
      filters.amount = { $gte: discountQueryDto.minAmount };
    }

    if (discountQueryDto.id) {
      filters._id = discountQueryDto.id;
    }

    if (discountQueryDto.state) {
      filters.state = discountQueryDto.state;
    }

    if (discountQueryDto.hotelId) {
      filters.applicableHotels = discountQueryDto.hotelId;
    }

    // // Add filter for non-expired discounts
    // filters.expiredTimestamp = { $gt: new Date() };

    return this.find({
      queryDto,
      filter: filters,
    });
  }

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

  async toggleDiscountState(
    user: User,
    discountId: string,
    state: DiscountState,
  ): Promise<Discount> {
    // Only admin can toggle discount state
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can change discount state');
    }

    const discount = await this.findOne({ _id: discountId });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${discountId} not found`);
    }

    const discountUpdated = await this.update({ state } as Partial<Discount>, {
      _id: discountId,
    });

    if (!discountUpdated || discountUpdated.length === 0) {
      throw new NotFoundException(`Discount with ID ${discountId} not found`);
    }
    return discountUpdated[0];
  }

  async incrementUsageCount(discountId: string): Promise<void> {
    const discount = await this.findOne({ _id: discountId });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${discountId} not found`);
    }

    await this.model.updateOne({ _id: discountId }, { $inc: { usageCount: 1 } });
  }
}
