import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HotelsModule } from '../hotels/hotels.module';
import { Booking, BookingSchema } from './../bookings/schemas/booking.schema';
import { RevenueController } from './controllers/revenue.controller';
import { DailyRevenueReport, DailyRevenueReportSchema } from './schemas/revenue.schema';
import { RevenueService } from './services/revenue.service';

@Module({
  imports: [
    // here only import modules that are needed for this module
    HotelsModule,
    MongooseModule.forFeature([
      { name: DailyRevenueReport.name, schema: DailyRevenueReportSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [RevenueController], // import service guards, interceptors, etc. here
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
