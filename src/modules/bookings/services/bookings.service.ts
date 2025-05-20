import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';

import { Booking } from '../schemas/booking.schema';

@Injectable()
export class BookingsService extends BaseService<Booking> {
  constructor(@InjectModel(Booking.name) protected readonly model: Model<Booking>) {
    const logger = new Logger(BookingsService.name);
    super(model, logger);
  }
}
