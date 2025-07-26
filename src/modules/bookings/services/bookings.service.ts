import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
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

import { BookingQueryDtoForAdmin, CreateBookingDto } from '../dtos/booking.dto';
import { BookingStatus, ExceptionKeys } from '../enums/booking-status.enum';
import { Booking } from '../schemas/booking.schema';

@Injectable()
export class BookingsService extends BaseService<Booking> {
  constructor(
    readonly discountService: DiscountsService,
    readonly hotelsService: HotelsService,
    @Inject(forwardRef(() => RoomsService))
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

  /**
   * Logic to create a new booking
   * 1. Validate check-in and check-out dates
   * 2. check hotel and room availability
   * 3. check room availability of this day
   * -> filter by condition: checkIn, checkOut, roomId, number of booking ( compare with maximum rooms )
   */
  async createBooking(user: User, createBookingDto: CreateBookingDto): Promise<Booking> {
    // 1. check hotel and room availability
    const hotel = await this.hotelsService.getHotelById(createBookingDto.hotel);

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${createBookingDto.hotel} not found`);
    }

    const room = await this.roomsService.getRoomById(createBookingDto.room);
    if (!room) {
      throw new NotFoundException(`Room with ID ${createBookingDto.room} not found`);
    }

    // check user booking limit || customer also book all of rooms in hotel in one day
    // with occupancy of room, if number of customer booking is greater than maximum occupancy of room
    // -> throw error || recommend to book another room

    // check room availability in this day
    const bookedCount = await this.findBookingByBusyRoom(
      room._id,
      createBookingDto.checkIn,
      createBookingDto.checkOut,
    );

    // count room is busy
    const amountRoomsBooked = bookedCount.reduce((acc, booking) => {
      return acc + (booking.quantity || 0);
    }, 0);

    // case 1: the number or booked room is greater than or equal to maximum occupancy of room
    if (amountRoomsBooked >= room.maxQuantity) {
      throw new BadRequestException({
        message: 'Room is fully booked for the selected dates',
        code: ExceptionKeys.ROOM_FULL,
        suggestion: 'Please choose another room or date',
      });
    }

    // case 2: the number of quantity ( from createBookingDto ) is greater than room that can not be booked
    if (createBookingDto.quantity > room.maxQuantity - amountRoomsBooked) {
      throw new BadRequestException({
        message: `You can only book up to ${room.maxQuantity - amountRoomsBooked} rooms for the selected dates`,
        code: ExceptionKeys.ROOM_LIMIT_EXCEEDED,
        suggestion: 'Please reduce the number of rooms or choose another date',
      });
    }

    // 2. check if the user has enough balance to book the room
    // the total people in the room must be less than or equal to maximum occupancy of room
    const maxPeople = room.occupancy * createBookingDto.quantity; // people in the room * quantity ( number of rooms booked )
    if (createBookingDto.minOccupancy > maxPeople) {
      throw new BadRequestException({
        message: `The people (minimum occupancy) of the booking is ${createBookingDto.minOccupancy}, but the maximum occupancy of the room is ${maxPeople}, you can book least ${createBookingDto.minOccupancy / room.occupancy} rooms`,
        code: ExceptionKeys.MIN_OCCUPANCY_NOT_MET,
        suggestion: 'Please reduce the number of people or choose another room',
      });
    }

    let discount: Discount | undefined;
    if (createBookingDto.discount) {
      discount = await this.discountService.getDiscountById(createBookingDto.discount);
      await this.discountService.decreaseDiscountUsage(createBookingDto.discount);
    }

    // count total price
    const totalPrice =
      (room?.rate *
        createBookingDto.quantity *
        Math.ceil(createBookingDto.checkOut.getTime() - createBookingDto.checkIn.getTime())) /
      (1000 * 60 * 60 * 24);
    const totalPriceAfterDiscounts = discount
      ? (1 - discount.amount / 100) * totalPrice
      : totalPrice;

    // get orderCode = timeStamp
    const orderCode = Date.now();

    return await this.createOne({
      ...createBookingDto,
      user: user,
      hotel: hotel,
      room: room,
      totalPrice: totalPriceAfterDiscounts,
      discount,
      orderCode: orderCode, // unique order code for the booking
      status: BookingStatus.CONFIRMED, // default status
      cancelPolicy: hotel.cancelPolicy,
    });
  }

  /**
   *  @description
   * This function checks if a room is busy during the specified check-in and check-out dates.
   * It returns a list of bookings that overlap with the requested dates.
   * For example, if a booking exists from 2025-10-01 to 2025-10-05 and the requested dates are
   * from 2025-10-03 to 2025-10-04, this booking will be returned as busy.
   * If no bookings overlap, an empty array is returned.
   * @note
   * we have a formula to check if a booking is busy:
   * @note
   *  startDate < checkOut_Old && endDate > checkIn_Old -> busy: && is very important
   */
  async findBookingByBusyRoom(
    roomId?: string,
    checkIn?: Date,
    checkOut?: Date,
    userId?: string,
  ): Promise<Booking[]> {
    // Find bookings for the room that overlap with the requested dates
    // không nên comment dòng này, vì nó sẽ làm mất tính năng tìm kiếm phòng trống
    const query = {
      room: roomId,
      status: { $ne: BookingStatus.CANCELLED },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
      ...(userId && { userId: userId }),
    };

    const bookings = await this.model.find(query);

    return bookings;
  }

  async bookedCountByHotel(hotelId: string, startDate: Date, endDate: Date) {
    const bookedCounts = await this.model.aggregate([
      // Giai đoạn 1: Lọc ra các booking có liên quan
      {
        $match: {
          hotel: hotelId, // Lọc đúng khách sạn
          status: { $nin: [BookingStatus.CANCELLED] }, // Chỉ lấy các booking chưa bị hủy
          // Áp dụng logic xung đột lịch (overlap)
          checkIn: { $lt: endDate },
          checkOut: { $gt: startDate },
        },
      },
      // Giai đoạn 2: Nhóm theo loại phòng và đếm
      {
        $group: {
          _id: '$room', // Nhóm tất cả các booking lại theo trường 'room' (room ID)
          bookedCount: { $sum: '$quantity' }, // Với mỗi booking trong nhóm, đếm +1
        },
      },
      // Giai đoạn 3 (Tùy chọn): Đổi tên trường _id cho dễ hiểu
      {
        $project: {
          _id: 0, // Bỏ trường _id cũ
          roomId: '$_id', // Đổi tên _id thành roomId
          bookedCount: 1, // Giữ lại trường bookedCount
        },
      },
    ]);

    return bookedCounts;
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

    await this.softDelete({ _id: bookingId }, user);
  }

  protected async preFind(
    options: FindManyOptions<Booking>,
    currentUser?: User,
  ): Promise<FindManyOptions<Booking>> {
    const findOptions = await super.preFind(options, currentUser);

    this.logger.debug(`Pre-find options:`, findOptions.queryDto);

    // Role-based filtering
    if (currentUser?.role === Role.CUSTOMER) {
      // Customers can only see their own bookings
      findOptions.filter = {
        ...findOptions.filter,
        user: currentUser._id,
      };
    }

    if (currentUser?.role === Role.HOTEL_OWNER) {
      // Hotel owners can only see bookings for their hotels
      // This requires a more complex query with populate
      // For now, let's add a note that this needs hotel lookup
      // TODO: Implement hotel owner filtering with aggregation pipeline
      this.logger.debug(`Hotel owner ${currentUser._id} is trying to access bookings`);
      // Fetch hotels owned
      const ownerHotels = await this.hotelsService.getHotelsByOwnerId(currentUser._id);
      findOptions.filter = {
        ...findOptions.filter,
        hotel: { $in: ownerHotels.map((hotel) => hotel._id) },
      };
    }

    if (findOptions.queryDto) {
      const bookingQueryDto = findOptions.queryDto as BookingQueryDtoForAdmin;

      // Apply filters based on query parameters
      findOptions.filter = {
        ...findOptions.filter,
        // filter booking in the future
        ...(bookingQueryDto.inFuture === 'true' && {
          checkIn: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)), // đầu ngày hôm nay
          },
        }),
        //
        ...(bookingQueryDto.id && { _id: bookingQueryDto.id }),
        ...(bookingQueryDto.userId && { user: bookingQueryDto.userId }),
        ...(bookingQueryDto.hotelId && { hotel: bookingQueryDto.hotelId }),
        ...(bookingQueryDto.roomId && { room: bookingQueryDto.roomId }),
        ...(bookingQueryDto.status && { status: bookingQueryDto.status }),
        ...(bookingQueryDto.cancelPolicy && { cancelPolicy: bookingQueryDto.cancelPolicy }),
      };

      // Filter by check-in date range
      if (bookingQueryDto.checkIn || bookingQueryDto.checkOut) {
        const dateFilter: any = {};
        if (bookingQueryDto.checkIn) {
          dateFilter.$gte = bookingQueryDto.checkIn;
        }
        if (bookingQueryDto.checkOut) {
          dateFilter.$lte = bookingQueryDto.checkOut;
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

      // Admin can filter by hotel owner ID
      if (bookingQueryDto.hotelOwnerId && currentUser?.role === Role.ADMIN) {
        // This would require aggregation to join with hotels collection
        // TODO: Implement aggregation pipeline for hotel owner filtering
        findOptions.filter = {
          ...findOptions.filter,
          hotel: { $eq: bookingQueryDto.hotelOwnerId },
        };
      }
    }

    return findOptions;
  }
}
