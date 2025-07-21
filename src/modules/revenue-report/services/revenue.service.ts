import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, PipelineStage } from 'mongoose';

import { BaseService, FindManyOptions } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { BookingStatus } from '@/modules/bookings/enums/booking-status.enum';
import { Booking } from '@/modules/bookings/schemas/booking.schema';
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
    const matchStage = await this.buildAuthMatchStage(_currentUser, hotelId);

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
    const matchStage = await this.buildAuthMatchStage(_currentUser, hotelId);

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

  private async buildAuthMatchStage(currentUser: User, hotelId?: string) {
    const matchStage: any = {};

    if (currentUser?.role === Role.ADMIN) {
      if (hotelId) {
        matchStage.hotel = hotelId;
      }
    } else if (currentUser?.role === Role.HOTEL_OWNER) {
      const ownedHotels = await this.hotelService.getHotelsByOwnerId(currentUser._id);
      const ownedHotelIds = ownedHotels.map((h) => h._id);

      if (hotelId) {
        // Chủ khách sạn yêu cầu xem 1 hotelId cụ thể
        // Kiểm tra xem hotelId đó có thuộc sở hữu của họ không
        if (ownedHotelIds.some((id) => id.toString() === hotelId)) {
          matchStage.hotel = hotelId;
        } else {
          // Ném lỗi hoặc trả về mảng rỗng nếu họ cố gắng xem khách sạn không phải của mình
          // Ở đây ta sẽ làm cho query không trả về kết quả nào
          matchStage.hotel = { $in: [] };
        }
      } else {
        // Chủ khách sạn muốn xem tất cả các khách sạn của họ
        matchStage.hotel = { $in: ownedHotelIds };
      }
    }

    return matchStage;
  }

  async setDayRevenueReport(startOfYesterday: Date, endOfYesterday: Date) {
    const aggregationPipeline: PipelineStage[] = [
      // find bookings with status PAID and checkIn date within yesterday
      // to give the total revenue and total bookings for each hotel
      {
        $match: {
          checkIn: { $gte: startOfYesterday, $lte: endOfYesterday },
          status: {
            $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
          },
        },
      },
      // group by hotel and date, calculate total revenue and total bookings
      {
        $group: {
          _id: {
            hotel: { $toString: '$hotel' }, // Convert ObjectId to string
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
          // Create a custom _id as string
          _id: { $concat: ['$_id.hotel', '_', '$_id.date'] },
          hotel: '$_id.hotel', // Already a string from $toString above
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

  /**
   * cron run every day at 1am to aggregate ( tổng hợp ) daily revenue.
   *  It will run every day at 1am.
   *  This function provides a way to aggregate daily revenue from bookings.
   *  And store the results in the 'daily_revenue_reports' collection.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
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
            $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
          },
        },
      },
      // group by hotel and date, calculate total revenue and total bookings
      {
        $group: {
          _id: {
            hotel: { $toString: '$hotel' }, // Convert ObjectId to string
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
          // Create a custom _id as string
          _id: { $concat: ['$_id.hotel', '_', '$_id.date'] },
          hotel: '$_id.hotel', // Already a string from $toString above
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

  /**
   * Tính toán lại tất cả revenue từ tất cả booking trong database
   * Sử dụng để rebuild revenue data hoặc fix data
   */
  async calculateAllRevenue(): Promise<{ message: string; totalProcessed: number }> {
    this.logger.log('Starting to calculate all revenue from all bookings...');

    const aggregationPipeline: PipelineStage[] = [
      // Lấy tất cả booking có status CONFIRMED hoặc COMPLETED
      {
        $match: {
          status: {
            $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
          },
          // Có thể thêm điều kiện khác nếu cần
          deleteTimestamp: null,
        },
      },
      // Group theo hotel và ngày check-in
      {
        $group: {
          _id: {
            hotel: { $toString: '$hotel' }, // Convert ObjectId to string
            date: { $dateToString: { format: '%Y-%m-%d', date: '$checkIn' } },
          },
          totalRevenue: { $sum: '$totalPrice' },
          totalBookings: { $sum: 1 },
        },
      },
      // Project để tạo structure phù hợp với DailyRevenueReport schema
      {
        $project: {
          _id: { $concat: ['$_id.hotel', '_', '$_id.date'] },
          hotel: '$_id.hotel',
          date: { $toDate: '$_id.date' },
          totalRevenue: '$totalRevenue',
          totalBookings: '$totalBookings',
        },
      },
      // Merge vào collection daily_revenue_reports
      {
        $merge: {
          into: 'daily_revenue_reports',
          on: ['hotel', 'date'],
          whenMatched: 'replace', // Thay thế nếu đã tồn tại
          whenNotMatched: 'insert', // Insert mới nếu chưa tồn tại
        },
      } as any,
    ];

    // Xóa tất cả data cũ trước khi tính toán lại (optional)
    await this.model.deleteMany({});

    // Thực hiện aggregation
    const _ = await this.bookingModel.aggregate(aggregationPipeline);

    // Đếm số lượng record được tạo
    const totalProcessed = await this.model.countDocuments();

    this.logger.log(`Finished calculating all revenue. Total records processed: ${totalProcessed}`);

    return {
      message: 'All revenue calculated successfully',
      totalProcessed,
    };
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
        // revenue >= minRevenue
        ...(revenueQueryDto.minRevenue && {
          revenue: {
            $gte: revenueQueryDto.minRevenue,
          },
        }),
        // revenue <= maxRevenue
        ...(revenueQueryDto.maxRevenue && {
          revenue: {
            $lte: revenueQueryDto.maxRevenue,
          },
        }),
        // number of bookings <= maxBookings
        ...(revenueQueryDto.maxBookings && {
          totalBookings: {
            $lte: revenueQueryDto.maxBookings,
          },
        }),
        // number of bookings >= minBookings
        ...(revenueQueryDto.minBookings && {
          totalBookings: {
            revenue: {
              $gte: revenueQueryDto.minBookings,
            },
          },
        }),
      };

      // compare user.role
      if (_currentUser?.role === Role.HOTEL_OWNER) {
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
      } else if (_currentUser?.role === Role.ADMIN) {
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
