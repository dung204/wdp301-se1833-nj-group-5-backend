import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { ApiSuccessResponse } from '@/base/decorators';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import { DailyRevenueReportResponseDto, RevenueQueryDtoForAdmin } from '../dtos/revenue.dto';
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
    summary: 'Search filter bookings, get all bookings, get booking by ID',
    description: 'Search bookings with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: DailyRevenueReportResponseDto,
    isArray: true,
    description: 'bookings retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Get('/')
  async GetAll(@CurrentUser() user: User, @Query() revenueQueryDto: RevenueQueryDtoForAdmin) {
    return await this.revenueService.getRevenueDaily(revenueQueryDto);
  }
}
