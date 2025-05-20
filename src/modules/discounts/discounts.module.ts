import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DiscountsController } from './controllers/discounts.controller';
import { Discount, DiscountSchema } from './schemas/discount.schema';
import { DiscountsService } from './services/discounts.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Discount.name, schema: DiscountSchema }])],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
