import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';

import { Transaction } from '../schemas/transaction.schema';

@Injectable()
export class TransactionsService extends BaseService<Transaction> {
  constructor(@InjectModel(Transaction.name) protected readonly model: Model<Transaction>) {
    const logger = new Logger(TransactionsService.name);
    super(model, logger);
  }
}
