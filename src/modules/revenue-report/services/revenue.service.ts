import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, PipelineStage } from 'mongoose';

import { BaseService, FindManyOptions } from '@/base/services';
import { BookingStatus } from '@/modules/bookings/enums/booking-status.enum';
import { Booking } from '@/modules/bookings/schemas/booking.schema';
import { User } from '@/modules/users/schemas/user.schema';

import { RevenueQueryDto, RevenueQueryDtoForAdmin } from '../dtos/revenue.dto';
import { DailyRevenueReport } from '../schemas/revenue.schema';

@Injectable()
export class RevenueService extends BaseService<DailyRevenueReport> {
  constructor(
    @InjectModel(DailyRevenueReport.name) protected readonly model: Model<DailyRevenueReport>,
    @InjectModel(Booking.name) protected readonly bookingModel: Model<Booking>, // Replace 'Booking' with the actual booking model name
  ) {
    const logger = new Logger(RevenueService.name);
    super(model, logger);
  }

  async getRevenueDaily(revenueQueryDto: RevenueQueryDto) {
    const findOptions: FindManyOptions<DailyRevenueReport> = {
      queryDto: revenueQueryDto,
      filter: { deleteTimestamp: null },
    };
    // list rooms with pagination, sorting and filtering options
    const response = await this.find(findOptions);

    return response;
  }

  /**
   * cron run every day at 1am to aggregate ( tổng hợp ) daily revenue.
   *  It will run every day at 1am.
   *  This function provides a way to aggregate daily revenue from bookings.
   *  And store the results in the 'daily_revenue_reports' collection.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron() {
    this.logger.log('Starting daily revenue aggregation job...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    const aggregationPipeline: PipelineStage[] = [
      // find bookings with status PAID and checkIn date within yesterday
      // to give the total revenue and total bookings for each hotel
      {
        $match: {
          checkIn: { $gte: startOfYesterday, $lte: endOfYesterday },
          status: BookingStatus.PAID,
        },
      },
      // group by hotel and date, calculate total revenue and total bookings
      {
        $group: {
          _id: {
            hotel: '$hotel',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$checkIn' } },
          },
          totalRevenue: { $sum: '$totalPrice' },
          totalBookings: { $sum: 1 },
        },
      },
      // project  the result to match the DailyRevenueReport schema
      // convert date string to Date object
      // and format the output
      {
        $project: {
          // project: to reshape the output document
          _id: 0,
          hotel: '$_id.hotel',
          date: { $toDate: '$_id.date' },
          totalRevenue: '$totalRevenue',
          totalBookings: '$totalBookings',
        },
      },
      // save the result to the daily_revenue_reports collection
      {
        $merge: {
          into: 'daily_revenue_reports',
          on: ['hotel', 'date'],
          whenMatched: 'replace',
          whenNotMatched: 'insert',
        },
      } as any, // Type assertion for $merge as it's not well-typed in mongoose
    ];

    const data = await this.bookingModel.aggregate(aggregationPipeline);

    this.logger.debug(`Daily revenue aggregation result: ${JSON.stringify(data)}`);
    this.logger.log('Daily revenue aggregation job finished.');
  }

  protected preFind(
    options: FindManyOptions<DailyRevenueReport>,
    _currentUser?: User,
  ): FindManyOptions<DailyRevenueReport> {
    const findOptions = super.preFind(options, _currentUser);

    if (findOptions.queryDto) {
      const revenueQueryDto = findOptions.queryDto as RevenueQueryDtoForAdmin;

      findOptions.filter = {
        ...findOptions.filter,
        ...(revenueQueryDto.dateFrom &&
          revenueQueryDto.dateTo && {
            date: {
              $gte: revenueQueryDto.dateFrom,
              $lte: revenueQueryDto.dateTo,
            },
          }),
        ...(revenueQueryDto.minRevenue &&
          revenueQueryDto.maxRevenue && {
            revenue: {
              $gte: revenueQueryDto.minRevenue,
              $lte: revenueQueryDto.maxRevenue,
            },
          }),
        ...(revenueQueryDto.minBookings &&
          revenueQueryDto.maxBookings && {
            revenue: {
              $gte: revenueQueryDto.minBookings,
              $lte: revenueQueryDto.maxBookings,
            },
          }),
      };

      // compare user.role
      if (_currentUser?.role === 'HOTEL_OWNER') {
        // get hotelId from current user
        // findOptions.filter = {
        //   ...findOptions.filter,
        //   ...({
        //     hotelId: revenueQueryDto.hotelId,
        //   }),
        // };
      } else if (_currentUser?.role === 'ADMIN') {
        findOptions.filter = {
          ...findOptions.filter,
          ...(revenueQueryDto.hotelId && {
            hotel: revenueQueryDto.hotelId,
          }),
        };
      }
    }

    return findOptions;
  }
}
