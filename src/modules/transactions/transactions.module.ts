import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BookingsModule } from '../bookings/bookings.module';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { TransactionsService } from './services/transactions.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    HttpModule,
    forwardRef(() => BookingsModule),
  ],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
