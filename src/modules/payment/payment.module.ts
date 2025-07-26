import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { TransactionsModule } from '../transactions/transactions.module';
import { PaymentsController } from './controllers/payment.controller';
import { PayosService } from './services/payment.service';

@Module({
  imports: [HttpModule, TransactionsModule],
  controllers: [PaymentsController],
  providers: [PayosService],
  exports: [PayosService],
})
export class PaymentsModule {}
