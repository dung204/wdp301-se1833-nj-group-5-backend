import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PaymentMethod, PaymentMethodSchema } from './schemas/payment-method.schema';
import { PaymentMethodsService } from './services/payment-methods.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: PaymentMethod.name, schema: PaymentMethodSchema }])],
  providers: [PaymentMethodsService],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
