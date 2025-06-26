import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RedisService } from '@/base/database';
import { BaseService } from '@/base/services';
import { BookingsService } from '@/modules/bookings/services/bookings.service';

import { CreateTransactionDto } from '../dtos/transaction.dtos';
import { Transaction } from '../schemas/transaction.schema';

@Injectable()
export class TransactionsService extends BaseService<Transaction> {
  constructor(
    @InjectModel(Transaction.name) protected readonly model: Model<Transaction>,
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
    private readonly bookingService: BookingsService,
  ) {
    const logger = new Logger(TransactionsService.name);
    super(model, logger);
  }

  async createTransaction(createTransition: CreateTransactionDto) {
    const booking = await this.bookingService.getBookingById(createTransition.booking);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return await this.createOne({
      ...createTransition,
      booking,
    });
  }
}
