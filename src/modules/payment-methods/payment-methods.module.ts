import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PaymentMethodsController } from './controllers/payment-methods.controller';
import { PaymentMethod, PaymentMethodSchema } from './schemas/payment-method.schema';
import { PaymentMethodsService } from './services/payment-methods.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: PaymentMethod.name, schema: PaymentMethodSchema }])],
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
