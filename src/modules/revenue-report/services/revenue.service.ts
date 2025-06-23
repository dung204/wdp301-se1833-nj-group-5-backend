import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, PipelineStage } from 'mongoose';

import { BaseService, FindManyOptions } from '@/base/services';
import { BookingStatus } from '@/modules/bookings/enums/booking-status.enum';
import { Booking } from '@/modules/bookings/schemas/booking.schema';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { User } from '@/modules/users/schemas/user.schema';

import { RevenueQueryDto } from '../dtos/revenue.dto';
import { DailyRevenueReport } from '../schemas/revenue.schema';

@Injectable()
export class RevenueService extends BaseService<DailyRevenueReport> {
  constructor(
    @InjectModel(DailyRevenueReport.name) protected readonly model: Model<DailyRevenueReport>,
    @InjectModel(Booking.name) protected readonly bookingModel: Model<Booking>,
    private readonly hotelService: HotelsService,
  ) {
    const logger = new Logger(RevenueService.name);
    super(model, logger);
  }

  async getRevenueDaily(revenueQueryDto: RevenueQueryDto) {
    const findOptions: FindManyOptions<DailyRevenueReport> = {
      queryDto: revenueQueryDto,
      filter: { deleteTimestamp: null },
    } as FindManyOptions<DailyRevenueReport>;
    // list rooms with pagination, sorting and filtering options
    const response = await this.find(findOptions);

    return response.data;
  }

  /**
   * Tính toán tổng doanh thu cho mỗi tháng trong một năm cụ thể.
   * @param year Năm cần tính toán (ví dụ: 2025)
   * @param _currentUser
   * @param hotelId ID của khách sạn (nếu cần lọc theo khách sạn cụ thể).
   * @returns Mảng chứa các object, mỗi object là doanh thu của một tháng.
   */
  async getMonthlyRevenue(
    year: number,
    _currentUser: User,
    hotelId?: string,
  ): Promise<{ hotelId: string; month: number; totalRevenue: number; totalBookings: number }[]> {
    let hotels = [] as Hotel[];
    if (hotelId && _currentUser?.role === 'HOTEL_OWNER') {
      hotels = await this.hotelService.getHotelsByOwnerId(_currentUser._id);
    }

    // matchStage để lọc các revenue report theo năm
    const matchStage = {
      date: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
      deleteTimestamp: null, // Chỉ lấy records chưa bị xóa
      // hotelOwner -> filter revenue by hotel and by year
      ...(hotelId && _currentUser?.role === 'HOTEL_OWNER'
        ? { hotel: { $in: hotels.map((hotel) => hotel._id) } }
        : {}),
      // admin -> filter revenue by hotel ( optional ) and by year
      ...(hotelId && _currentUser?.role === 'ADMIN' ? { hotel: hotelId } : {}),
    };

    // Sử dụng DailyRevenueReport model thay vì Booking model
    const monthlyRevenue = await this.model.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: {
            hotel: '$hotel', // Nhóm theo hotel
            month: { $month: '$date' }, // Nhóm theo tháng từ date field
          },
          totalRevenue: { $sum: '$totalRevenue' }, // Tổng revenue đã tính sẵn
          totalBookings: { $sum: '$totalBookings' }, // Tổng bookings đã tính sẵn
        },
      },
      {
        $sort: {
          '_id.hotel': 1,
          '_id.month': 1,
        },
      },
      {
        $project: {
          _id: 0,
          hotelId: '$_id.hotel',
          month: '$_id.month',
          totalRevenue: 1,
          totalBookings: 1,
        },
      },
    ]);

    this.logger.debug(`Monthly revenue for year ${year}: ${JSON.stringify(monthlyRevenue)}`);
    return monthlyRevenue;
  }

  async getYearlyRevenue(
    _currentUser: User,
    hotelId?: string,
  ): Promise<{ hotelId: string; year: number; totalRevenue: number; totalBookings: number }[]> {
    let hotels = [] as Hotel[];
    if (hotelId && _currentUser?.role === 'HOTEL_OWNER') {
      hotels = await this.hotelService.getHotelsByOwnerId(_currentUser._id);
    }

    const matchStage = {
      deleteTimestamp: null, // Chỉ lấy records chưa bị xóa
      // hotelOwner -> filter revenue by hotel
      ...(hotelId && _currentUser?.role === 'HOTEL_OWNER'
        ? { hotel: { $in: hotels.map((hotel) => hotel._id) } }
        : {}),
      // admin -> filter revenue by hotel (optional)
      ...(hotelId && _currentUser?.role === 'ADMIN' ? { hotel: hotelId } : {}),
    };

    const yearlyRevenue = await this.model.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: {
            hotel: '$hotel',
            year: { $year: '$date' }, // Lấy năm từ date field
          },
          totalRevenue: { $sum: '$totalRevenue' },
          totalBookings: { $sum: '$totalBookings' },
        },
      },
      {
        $sort: {
          '_id.hotel': 1,
          '_id.year': 1,
        },
      },
      {
        $project: {
          _id: 0,
          hotelId: '$_id.hotel',
          year: '$_id.year',
          totalRevenue: 1,
          totalBookings: 1,
        },
      },
    ]);

    return yearlyRevenue;
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
          status: {
            $in: [BookingStatus.PAID, BookingStatus.NOT_PAID_YET],
          },
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

  protected async preFind(
    options: FindManyOptions<DailyRevenueReport>,
    _currentUser?: User,
  ): Promise<FindManyOptions<DailyRevenueReport>> {
    const findOptions = options;

    if (findOptions.queryDto) {
      const revenueQueryDto = findOptions.queryDto as RevenueQueryDto;

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
        const hotels = await this.hotelService.getHotelsByOwnerId(_currentUser._id);

        findOptions.filter = {
          ...findOptions.filter,
          hotel: { $in: hotels.map((hotel) => hotel._id) },
        };
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
