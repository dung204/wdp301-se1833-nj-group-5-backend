import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { ApiSuccessResponse } from '@/base/decorators';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import {
  DailyRevenueReportResponseDto,
  MonthlyRevenueQueryDto,
  MonthlyRevenueResponseDto,
  RevenueQueryDto,
  YearlyRevenueQueryDto,
  YearlyRevenueResponseDto,
} from '../dtos/revenue.dto';
import { DailyRevenueReport } from '../schemas/revenue.schema';
import { RevenueService } from '../services/revenue.service';

@Controller('revenue-report')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  private transformToDto(
    data: DailyRevenueReport | DailyRevenueReport[],
  ): DailyRevenueReportResponseDto | DailyRevenueReportResponseDto[] {
    return plainToInstance(DailyRevenueReportResponseDto, data);
  }

  /**
   * [GET] /revenue-report/
   *  Get daily revenue reports
   * @param currentUser
   * @param revenueQueryDto
   * @returns
   */
  @ApiOperation({
    summary: 'Get daily revenue reports',
    description: 'Get daily revenue reports with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: DailyRevenueReportResponseDto,
    isArray: true,
    description: 'Daily revenue reports retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Get('/')
  async getAll(@CurrentUser() currentUser: User, @Query() revenueQueryDto: RevenueQueryDto) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate());
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));
    // Set the day revenue report if not already set
    await this.revenueService.setDayRevenueReport(startOfYesterday, endOfYesterday);
    //
    const result = await this.revenueService.getRevenueDaily(revenueQueryDto, currentUser);
    return {
      data: this.transformToDto(result.data),
      metadata: result.metadata,
    };
  }

  /**
   * [GET] /revenue-report/yearly
   * Get yearly revenue statistics
   * @param user
   * @param queryDto
   * @returns
   */
  @ApiOperation({
    summary: 'Get yearly revenue statistics',
    description: 'Get revenue statistics grouped by hotel and year',
  })
  @ApiSuccessResponse({
    schema: YearlyRevenueResponseDto,
    isArray: true,
    description: 'Yearly revenue statistics retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Get('/yearly')
  async getYearlyRevenue(@CurrentUser() user: User, @Query() queryDto: YearlyRevenueQueryDto) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate());
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));
    // Set the day revenue report if not already set
    await this.revenueService.setDayRevenueReport(startOfYesterday, endOfYesterday);
    //
    const result = await this.revenueService.getYearlyRevenue(queryDto, user, queryDto.hotelId);
    return {
      data: plainToInstance(YearlyRevenueResponseDto, result),
      metadata: {
        total: result.length,
      },
    };
  }

  /**
   * [GET] /revenue-report/monthly
   * Get monthly revenue statistics
   * @param user
   * @param queryDto
   * @returns
   */
  @ApiOperation({
    summary: 'Get monthly revenue statistics',
    description: 'Get revenue statistics grouped by hotel and month for a specific year',
  })
  @ApiSuccessResponse({
    schema: MonthlyRevenueResponseDto,
    isArray: true,
    description: 'Monthly revenue statistics retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Get('/monthly')
  async getMonthlyRevenue(@CurrentUser() user: User, @Query() queryDto: MonthlyRevenueQueryDto) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate());
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));
    // Set the day revenue report if not already set
    await this.revenueService.setDayRevenueReport(startOfYesterday, endOfYesterday);
    //
    const result = await this.revenueService.getMonthlyRevenue(queryDto, user, queryDto.hotelId);
    return {
      data: plainToInstance(MonthlyRevenueResponseDto, result),
      metadata: {
        total: result.length,
      },
    };
  }

  /**
   * [GET] /revenue-report/calculate-all
   * Recalculate all revenue data from all bookings
   * @returns
   */
  @ApiOperation({
    summary: 'Calculate all revenue from all bookings',
    description: 'Recalculate all revenue data from all bookings in database (Admin only)',
  })
  @ApiSuccessResponse({
    schema: DailyRevenueReportResponseDto,
    isArray: true,
    description: 'All revenue calculated successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER]) // Chỉ admin mới được sử dụng
  @Get('/calculate-all')
  async calculateAllRevenue() {
    const result = await this.revenueService.calculateAllRevenue();
    return result;
  }
}
