import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService, FindManyOptions } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateReviewDto, ReviewQueryDto, UpdateReviewDto } from '../dtos/review.dto';
import { Review } from '../schemas/review.schema';

@Injectable()
export class ReviewsService extends BaseService<Review> {
  constructor(
    @InjectModel(Review.name) protected readonly model: Model<Review>,
    private readonly hotelService: HotelsService,
  ) {
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
    const hotel = await this.hotelService.getHotelById(createReviewDto.hotel);

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${createReviewDto.hotel} not found`);
    }

    return this.createOne({
      ...createReviewDto,
      user: user,
      hotel: hotel,
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

    return this.update(updateReviewDto, { _id: reviewId });
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

    await this.softDelete({ _id: reviewId });
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

  preFind(options: FindManyOptions<Review>, currentUser?: User) {
    const preProcessedOptions = super.preFind(options, currentUser);
    const reviewQueryDto = preProcessedOptions.queryDto as ReviewQueryDto;

    preProcessedOptions.filter = {
      ...preProcessedOptions.filter,
      ...(reviewQueryDto.hotel && { hotel: reviewQueryDto.hotel }),
      ...(reviewQueryDto.id && { _id: reviewQueryDto.id }),
      ...(reviewQueryDto.user && { user: reviewQueryDto.user }),
      ...(reviewQueryDto.minRating && { rating: { $gte: reviewQueryDto.minRating } }),
    };

    return preProcessedOptions;
  }
}
