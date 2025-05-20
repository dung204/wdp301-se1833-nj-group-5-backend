import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';

import { Discount } from '../schemas/discount.schema';

@Injectable()
export class DiscountsService extends BaseService<Discount> {
  constructor(@InjectModel(Discount.name) protected readonly model: Model<Discount>) {
    const logger = new Logger(DiscountsService.name);
    super(model, logger);
  }
}
