import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { QueryDto } from '@/base/dtos';
import { BaseService } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateDiscountDto, DiscountQueryDto, UpdateDiscountDto } from '../dtos/discount.dto';
import { DiscountState } from '../enums/discount.enum';
import { Discount } from '../schemas/discount.schema';

@Injectable()
export class DiscountsService extends BaseService<Discount> {
  constructor(@InjectModel(Discount.name) protected readonly model: Model<Discount>) {
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

    return this.createOne(user._id.toString(), {
      ...createDiscountDto,
      usageCount: 0, // Initialize usage count
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

    return this.update(user._id.toString(), updateDiscountDto, { _id: discountId });
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

    await this.softDelete(user._id.toString(), { _id: discountId });
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

    const discountUpdated = await this.update(user._id.toString(), { state } as Partial<Discount>, {
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

  // async validateDiscount(discountId: string, userId: string): Promise<Discount> {
  //   const discount = await this.findOne({
  //     _id: discountId,
  //     isActive: true,
  //     state: DiscountState.ACTIVE,
  //     expiredTimestamp: { $gt: new Date() }
  //   });

  //   if (!discount) {
  //     throw new NotFoundException('Invalid or expired discount');
  //   }

  //   // Add additional validation logic here if needed
  //   // For example, check if user has already used this discount
  //   // Or check if usage count has exceeded maxQualityPerUser

  //   return discount;
  // }
}
