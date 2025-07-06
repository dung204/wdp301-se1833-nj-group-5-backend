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
  async getAll(@CurrentUser() user: User, @Query() revenueQueryDto: RevenueQueryDto) {
    const result = await this.revenueService.getRevenueDaily(revenueQueryDto);
    return this.transformToDto(result);
  }

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
  async getYearlyRevenue(
    @CurrentUser() user: User,
    @Query() queryDto: YearlyRevenueQueryDto,
  ): Promise<YearlyRevenueResponseDto[]> {
    const result = await this.revenueService.getYearlyRevenue(user, queryDto.hotelId);
    return plainToInstance(YearlyRevenueResponseDto, result);
  }

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
  async getMonthlyRevenue(
    @CurrentUser() user: User,
    @Query() queryDto: MonthlyRevenueQueryDto,
  ): Promise<MonthlyRevenueResponseDto[]> {
    const result = await this.revenueService.getMonthlyRevenue(
      queryDto.year,
      user,
      queryDto.hotelId,
    );
    return plainToInstance(MonthlyRevenueResponseDto, result);
  }
}
