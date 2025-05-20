import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HotelsController } from './controllers/hotels.controller';
import { Hotel, HotelSchema } from './schemas/hotel.schema';
import { HotelsService } from './services/hotels.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Hotel.name, schema: HotelSchema }])],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [HotelsService],
})
export class HotelsModule {}
