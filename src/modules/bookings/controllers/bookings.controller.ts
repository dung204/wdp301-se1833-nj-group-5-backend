import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { ApiSuccessResponse } from '@/base/decorators';
import { transformDataToDto } from '@/base/utils';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import {
  BookingQueryDtoForAdmin,
  BookingResponseDto,
  CreateBookingDto,
  UpdateBookingDto,
} from '@/modules/bookings/dtos/booking.dto';
import { Booking } from '@/modules/bookings/schemas/booking.schema';
import { BookingsService } from '@/modules/bookings/services/bookings.service';
import { PayosService } from '@/modules/payment/services/payment.service';
import { TransactionResponseDto } from '@/modules/transactions/dtos/transaction.dtos';
import {
  PaymentMethodEnum,
  Transaction,
  TransactionStatus,
} from '@/modules/transactions/schemas/transaction.schema';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';
import { User } from '@/modules/users/schemas/user.schema';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly transactionsService: TransactionsService,
    private readonly payosService: PayosService,
  ) {}

  private transformToDto(data: Booking | Booking[]): BookingResponseDto | BookingResponseDto[] {
    return plainToInstance(BookingResponseDto, data);
  }

  private transformToDtoTransaction(data: Transaction): TransactionResponseDto {
    return plainToInstance(TransactionResponseDto, data);
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
    // 1. create a new booking
    const booking = await this.bookingsService.createBooking(user, createBookingDto);

    if (booking.paymentMethod === PaymentMethodEnum.PAYMENT_GATEWAY) {
      // 1. create a new transaction
      const _ = await this.transactionsService.createTransaction({
        booking: booking._id,
        amount: booking.totalPrice,
        paymentMethod: booking.paymentMethod,
        status: TransactionStatus.PENDING,
        paymentGateway: 'PAYOS',
      });

      // 2. call paymentService to create a payment URL
      const paymentLinkData = await this.payosService.createPaymentLink(booking);

      // 3. return the payment link
      return {
        ...this.transformToDto(booking),
        paymentLink: paymentLinkData.checkoutUrl,
      };
    }

    return this.transformToDto(booking);
  }

  @ApiOperation({
    summary: 'Update a hotel',
    description: 'Update a hotel (only for owner or admin)',
  })
  @ApiSuccessResponse({
    schema: BookingResponseDto,
    description: 'Hotel updated successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER, Role.CUSTOMER])
  @Patch(':id')
  async updateHotel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateBooking: UpdateBookingDto,
  ) {
    return transformDataToDto(
      BookingResponseDto,
      await this.bookingsService.update(
        { ...updateBooking } as Partial<Booking>,
        { _id: id },
        user,
      ),
    );
  }
}
