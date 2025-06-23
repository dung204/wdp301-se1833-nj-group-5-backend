import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Booking, BookingSchema } from './../bookings/schemas/booking.schema';
import { RevenueController } from './controllers/revune.controller';
import { DailyRevenueReport, DailyRevenueReportSchema } from './schemas/revenue.schema';
import { RevenueService } from './services/revenue.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyRevenueReport.name, schema: DailyRevenueReportSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
