import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';

import { Hotel } from '../schemas/hotel.schema';

@Injectable()
export class HotelsService extends BaseService<Hotel> {
  constructor(@InjectModel(Hotel.name) protected readonly model: Model<Hotel>) {
    const logger = new Logger(HotelsService.name);
    super(model, logger);
  }
}
