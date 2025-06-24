import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DiscountsModule } from '../discounts/discounts.module';
import { HotelsModule } from '../hotels/hotels.module';
import { RoomsModule } from '../rooms/rooms.module';
import { BookingsController } from './controllers/bookings.controller';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingsService } from './services/bookings.service';

@Module({
  imports: [
    DiscountsModule,
    HotelsModule,
    forwardRef(() => RoomsModule), // Forward reference to RoomsModule
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
