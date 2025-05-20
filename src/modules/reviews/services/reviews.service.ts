import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';

import { Review } from '../schemas/review.schema';

@Injectable()
export class ReviewsService extends BaseService<Review> {
  constructor(@InjectModel(Review.name) protected readonly model: Model<Review>) {
    const logger = new Logger(ReviewsService.name);
    super(model, logger);
  }
}
