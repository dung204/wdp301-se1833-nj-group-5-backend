import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DiscountsModule } from '../discounts/discounts.module';
import { HotelsModule } from '../hotels/hotels.module';
import { RoomsModule } from '../rooms/rooms.module';
import { BookingsController } from './controllers/bookings.controller';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingsService } from './services/bookings.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    RoomsModule,
    DiscountsModule,
    HotelsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
