import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { ApiSuccessResponse } from '@/base/decorators';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import {
  BookingQueryDtoForAdmin,
  BookingResponseDto,
  CreateBookingDto,
} from '@/modules/bookings/dtos/booking.dto';
import { Booking } from '@/modules/bookings/schemas/booking.schema';
import { BookingsService } from '@/modules/bookings/services/bookings.service';
import { User } from '@/modules/users/schemas/user.schema';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  private transformToDto(data: Booking | Booking[]): BookingResponseDto | BookingResponseDto[] {
    return plainToInstance(BookingResponseDto, data);
  }

  @ApiOperation({
    summary: 'Search filter bookings, get all bookings, get booking by ID',
    description: 'Search bookings with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: BookingResponseDto,
    isArray: true,
    description: 'bookings retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER, Role.CUSTOMER])
  @Get('/')
  async GetAll(@CurrentUser() user: User, @Query() bookingQuery: BookingQueryDtoForAdmin) {
    const result = await this.bookingsService.find(bookingQuery, user);

    return {
      data: this.transformToDto(result.data),
      metadata: result.metadata,
    };
  }

  @ApiOperation({
    summary: 'Create a new booking',
    description: 'Create a new booking for a hotel room',
  })
  @ApiSuccessResponse({
    schema: BookingResponseDto,
    description: 'Booking created successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER, Role.CUSTOMER])
  @Post('/')
  async BookingHotel(@CurrentUser() user: User, @Body() createBookingDto: CreateBookingDto) {
    const result = await this.bookingsService.createBooking(user, createBookingDto);

    return this.transformToDto(result);
  }
}
