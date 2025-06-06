import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HotelsModule } from '@/modules/hotels/hotels.module';

import { DiscountsController } from './controllers/discounts.controller';
import { Discount, DiscountSchema } from './schemas/discount.schema';
import { DiscountsService } from './services/discounts.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Discount.name, schema: DiscountSchema }]),
    HotelsModule,
  ],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
