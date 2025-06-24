import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { PayosService } from './services/payment.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [PayosService],
  exports: [PayosService],
})
export class PaymentsModule {}
