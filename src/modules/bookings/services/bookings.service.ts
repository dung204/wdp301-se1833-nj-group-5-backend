import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService, FindManyOptions } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { Discount } from '@/modules/discounts/schemas/discount.schema';
import { DiscountsService } from '@/modules/discounts/services/discounts.service';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { RoomsService } from '@/modules/rooms/services/rooms.service';
import { User } from '@/modules/users/schemas/user.schema';

import {
  BookingQueryDtoForAdmin,
  CreateBookingDto,
  // UpdateBookingDto,
} from '../dtos/booking.dto';
import { BookingStatus } from '../enums/booking-status.enum';
import { Booking } from '../schemas/booking.schema';

@Injectable()
export class BookingsService extends BaseService<Booking> {
  constructor(
    readonly discountService: DiscountsService,
    readonly hotelsService: HotelsService,
    readonly roomsService: RoomsService,
    @InjectModel(Booking.name) protected readonly model: Model<Booking>,
  ) {
    const logger = new Logger(BookingsService.name);
    super(model, logger);
  }

  async getBookingById(id: string): Promise<Booking> {
    const booking = await this.findOne({ _id: id });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async createBooking(user: User, createBookingDto: CreateBookingDto): Promise<Booking> {
    // Validate check-in and check-out dates
    if (new Date(createBookingDto.checkIn) >= new Date(createBookingDto.checkOut)) {
      throw new BadRequestException('Check-in date must be before check-out date');
    }

    if (new Date(createBookingDto.checkIn) <= new Date()) {
      throw new BadRequestException('Check-in date must be in the future');
    }

    // check hotel and room availability
    const hotel = await this.hotelsService.getHotelById(createBookingDto.hotel);

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${createBookingDto.hotel} not found`);
    }

    const room = await this.roomsService.getRoomById(createBookingDto.room);
    if (!room) {
      throw new NotFoundException(`Room with ID ${createBookingDto.room} not found`);
    }

    let discounts = [] as Discount[];
    // get all discounts for the booking
    if (createBookingDto.discounts && createBookingDto.discounts.length > 0) {
      discounts = await this.discountService.getDiscountsByIds(createBookingDto.discounts);

      // decrease the discount amount if the discount is not applicable for the hotel
      for (const discountId of discounts) {
        await this.discountService.decreaseDiscountUsage(discountId._id);
      }

      // KHÔNG BẮT ĐƯỢC THROW NEW :))))))
      // createBookingDto.discounts.forEach(async (discountId) => {
      //   await this.discountService.decreaseDiscountUsage(discountId);
      // });
    }

    // count total price
    const totalPrice = room?.rate;
    let discountAmount = 0;
    let totalPriceAfterDiscounts = totalPrice;
    // if discounts are applied, calculate the total price after applying discounts
    if (discounts.length > 0) {
      discountAmount = discounts.reduce((acc, discount) => acc + (discount.amount || 0), 0);
      totalPriceAfterDiscounts = totalPrice - (discountAmount * totalPrice) / 100;
    }

    return this.createOne({
      ...createBookingDto,
      user: user,
      hotel: hotel,
      room: room,
      totalPrice: totalPriceAfterDiscounts,
      discounts: discounts,
    });
  }

  // async cancelBooking(
  //   user: User,
  //   bookingId: string,
  // ): Promise<Booking> {
  //   const booking = await this.getBookingById(bookingId);

  //   // Check permissions
  //   if (booking.user.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
  //     throw new ForbiddenException('You do not have permission to cancel this booking');
  //   }

  //   // check date and base on hotel cancel policy to calculate refund amount

  //   // check refund amount

  //   return await this.update(
  //     {
  //       status: BookingStatus.CANCELLED,
  //       cancelledAt: new Date(),
  //       refundAmount,
  //     },
  //     { _id: bookingId },
  //     user,
  //   );
  // }

  protected preFind(
    options: FindManyOptions<Booking>,
    currentUser?: User,
  ): FindManyOptions<Booking> {
    const findOptions = super.preFind(options, currentUser);
    const bookingQueryDto = findOptions.queryDto as BookingQueryDtoForAdmin;

    // Apply filters based on query parameters
    findOptions.filter = {
      ...findOptions.filter,
      ...(bookingQueryDto.id && { _id: bookingQueryDto.id }),
      ...(bookingQueryDto.userId && { user: bookingQueryDto.userId }),
      ...(bookingQueryDto.hotelId && { hotel: bookingQueryDto.hotelId }),
      ...(bookingQueryDto.roomId && { room: bookingQueryDto.roomId }),
      ...(bookingQueryDto.status && { status: bookingQueryDto.status }),
      ...(bookingQueryDto.cancelPolicy && { cancelPolicy: bookingQueryDto.cancelPolicy }),
    };

    // Filter by check-in date range
    if (bookingQueryDto.checkInFrom || bookingQueryDto.checkInTo) {
      const dateFilter: any = {};
      if (bookingQueryDto.checkInFrom) {
        dateFilter.$gte = bookingQueryDto.checkInFrom;
      }
      if (bookingQueryDto.checkInTo) {
        dateFilter.$lte = bookingQueryDto.checkInTo;
      }
      findOptions.filter = {
        ...findOptions.filter,
        checkIn: dateFilter,
      };
    }

    // Filter by price range
    if (bookingQueryDto.minPrice || bookingQueryDto.maxPrice) {
      const priceFilter: any = {};
      if (bookingQueryDto.minPrice) {
        priceFilter.$gte = bookingQueryDto.minPrice;
      }
      if (bookingQueryDto.maxPrice) {
        priceFilter.$lte = bookingQueryDto.maxPrice;
      }
      findOptions.filter = {
        ...findOptions.filter,
        totalPrice: priceFilter,
      };
    }

    // Role-based filtering
    if (currentUser?.role === Role.CUSTOMER) {
      // Customers can only see their own bookings
      findOptions.filter = {
        ...findOptions.filter,
        user: currentUser._id,
      };
    } else if (currentUser?.role === Role.HOTEL_OWNER) {
      // Hotel owners can only see bookings for their hotels
      // This requires a more complex query with populate
      // For now, let's add a note that this needs hotel lookup
      // TODO: Implement hotel owner filtering with aggregation pipeline
    }

    // Admin can filter by hotel owner ID
    if (bookingQueryDto.hotelOwnerId && currentUser?.role === Role.ADMIN) {
      // This would require aggregation to join with hotels collection
      // TODO: Implement aggregation pipeline for hotel owner filtering
    }

    return findOptions;
  }

  async deleteBooking(user: User, bookingId: string): Promise<void> {
    const booking = await this.findOne({ _id: bookingId });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Check permissions
    if (booking.user.toString() !== user._id.toString() && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this booking');
    }

    // Don't allow deletion of confirmed or checked-in bookings
    if ([BookingStatus.CANCELLED].includes(booking.status)) {
      throw new BadRequestException(
        'Cannot delete confirmed or completed bookings. Use cancellation instead.',
      );
    }

    await this.softDelete({ _id: bookingId });
  }
}
