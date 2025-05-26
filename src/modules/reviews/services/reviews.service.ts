import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { QueryDto } from '@/base/dtos';
import { BaseService } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateReviewDto, ReviewQueryDto, UpdateReviewDto } from '../dtos/review.dto';
import { Review } from '../schemas/review.schema';

@Injectable()
export class ReviewsService extends BaseService<Review> {
  constructor(@InjectModel(Review.name) protected readonly model: Model<Review>) {
    const logger = new Logger(ReviewsService.name);
    super(model, logger);
  }

  async getAllReviews() {
    return this.find();
  }

  async getReviewById(id: string): Promise<Review> {
    const review = await this.findOne({ _id: id });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async createReview(user: User, createReviewDto: CreateReviewDto): Promise<Review> {
    return this.createOne(user._id.toString(), {
      ...createReviewDto,
      user: user._id,
    });
  }

  async updateReview(user: User, reviewId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.findOne({ _id: reviewId });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    // Check if user is the review owner or admin
    if (review.user.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this review');
    }

    return this.update(user._id.toString(), updateReviewDto, { _id: reviewId });
  }

  async findReviews(options: {
    queryDto: QueryDto;
    reviewQueryDto?: ReviewQueryDto;
    filter?: Record<string, unknown>;
  }) {
    const { queryDto, reviewQueryDto = {}, filter = {} } = options;
    const filters: Record<string, any> = { ...filter };

    // Handle filters from ReviewQueryDto
    if (reviewQueryDto.hotel) {
      filters.hotel = reviewQueryDto.hotel;
    }

    if (reviewQueryDto.id) {
      filters._id = reviewQueryDto.id;
    }

    if (reviewQueryDto.user) {
      filters.user = reviewQueryDto.user;
    }

    if (reviewQueryDto.minRating) {
      filters.rating = { $gte: reviewQueryDto.minRating };
    }

    return this.find({
      queryDto,
      filter: filters,
    });
  }

  async deleteReview(user: User, reviewId: string): Promise<void> {
    const review = await this.findOne({ _id: reviewId });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    // Check delete permissions
    if (review.user.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this review');
    }

    await this.softDelete(user._id.toString(), { _id: reviewId });
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    const response = await this.find({
      filter: { user: userId },
    });
    return response.data;
  }

  async getReviewsByHotel(hotelId: string): Promise<Review[]> {
    const response = await this.find({
      filter: { hotel: hotelId },
    });
    return response.data;
  }
}
