import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';

import { PaymentMethod } from '../schemas/payment-method.schema';

@Injectable()
export class PaymentMethodsService extends BaseService<PaymentMethod> {
  constructor(@InjectModel(PaymentMethod.name) protected readonly model: Model<PaymentMethod>) {
    const logger = new Logger(PaymentMethodsService.name);
    super(model, logger);
  }
}
