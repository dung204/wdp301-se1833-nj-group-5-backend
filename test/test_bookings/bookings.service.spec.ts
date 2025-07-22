import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BookingsService } from '@/modules/bookings/services/bookings.service';
import { Booking } from '@/modules/bookings/schemas/booking.schema';
import { BookingStatus } from '@/modules/bookings/enums/booking-status.enum';
import { PaymentMethodEnum } from '@/modules/transactions/schemas/transaction.schema';
import { User } from '@/modules/users/schemas/user.schema';
import { Role } from '@/modules/auth/enums/role.enum';
import { CreateBookingDto } from '@/modules/bookings/dtos/booking.dto';
import { DiscountsService } from '@/modules/discounts/services/discounts.service';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { RoomsService } from '@/modules/rooms/services/rooms.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingModel: jest.Mocked<Model<Booking>>;
  let hotelsService: jest.Mocked<HotelsService>;
  let roomsService: jest.Mocked<RoomsService>;
  let discountsService: jest.Mocked<DiscountsService>;

  const mockUser: User = {
    _id: 'user-id-123',
    email: 'test@example.com',
    role: Role.CUSTOMER,
    fullName: 'Test User',
  } as User;

  const mockBooking: Booking = {
    _id: 'booking-id-123',
    user: 'user-id-123',
    hotel: 'hotel-id-123',
    room: 'room-id-123',
    checkIn: new Date('2025-01-01'),
    checkOut: new Date('2025-01-02'),
    totalPrice: 100,
    quantity: 1,
    status: BookingStatus.CONFIRMED,
    paymentMethod: PaymentMethodEnum.PAYMENT_GATEWAY,
    orderCode: 'ORDER123',
    minOccupancy: 1,
    discounts: [],
    cancelPolicy: 'Free cancellation',
    createTimestamp: new Date(),
    updateTimestamp: new Date(),
    deleteTimestamp: null,
  } as unknown as Booking;

  const mockCreateBookingDto: CreateBookingDto = {
    hotel: 'hotel-id-123',
    room: 'room-id-123',
    checkIn: new Date('2025-01-01'),
    checkOut: new Date('2025-01-02'),
    quantity: 1,
    minOccupancy: 1,
    paymentMethod: PaymentMethodEnum.PAYMENT_GATEWAY,
  };

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: DiscountsService,
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            getDiscountsByIds: jest.fn(),
            decreaseDiscountUsage: jest.fn(),
          },
        },
        {
          provide: HotelsService, 
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            getHotelById: jest.fn(),
          },
        },
        {
          provide: RoomsService,
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            getRoomById: jest.fn(),
            checkRoomAvailability: jest.fn(),
          },
        },
        {
          provide: getModelToken(Booking.name),
          useValue: {
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockReturnThis(),
            findById: jest.fn().mockReturnThis(),
            create: jest.fn(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            findByIdAndDelete: jest.fn().mockReturnThis(),
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
            deleteMany: jest.fn(),
            updateMany: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn(),
            new: jest.fn().mockResolvedValue(mockBooking),
            constructor: jest.fn().mockResolvedValue(mockBooking),
            save: jest.fn().mockResolvedValue(mockBooking),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingModel = module.get(getModelToken(Booking.name)) as jest.Mocked<Model<Booking>>;
    hotelsService = module.get(HotelsService);
    roomsService = module.get(RoomsService);
    discountsService = module.get(DiscountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    it('should create a new booking successfully', async () => {
      // Arrange
      const mockHotel = { _id: 'hotel-id-123', name: 'Test Hotel', cancelPolicy: 'Free cancellation' };
      const mockRoom = { _id: 'room-id-123', rate: 100, maxQuantity: 5, occupancy: 2 };
      
      hotelsService.getHotelById.mockResolvedValue(mockHotel as any);
      roomsService.getRoomById.mockResolvedValue(mockRoom as any);
      
      // Mock discount service methods (even though discounts is empty in mockCreateBookingDto)
      discountsService.getDiscountsByIds.mockResolvedValue([]);
      discountsService.decreaseDiscountUsage.mockResolvedValue({} as any);
      
      // Mock findBookingByBusyRoom to return empty array (no existing bookings)
      jest.spyOn(service, 'findBookingByBusyRoom').mockResolvedValue([]);
      
      // Mock createOne to return the booking
      jest.spyOn(service, 'createOne').mockResolvedValue(mockBooking);

      // Act
      const result = await service.createBooking(mockUser, mockCreateBookingDto);

      // Assert
      expect(hotelsService.getHotelById).toHaveBeenCalledWith(mockCreateBookingDto.hotel);
      expect(roomsService.getRoomById).toHaveBeenCalledWith(mockCreateBookingDto.room);
      expect(result).toEqual(mockBooking);
    });

    it('should throw error when booking creation fails', async () => {
      // Arrange
      const mockHotel = { _id: 'hotel-id-123', name: 'Test Hotel', cancelPolicy: 'Free cancellation' };
      const mockRoom = { _id: 'room-id-123', rate: 100, maxQuantity: 5, occupancy: 2 };
      
      hotelsService.getHotelById.mockResolvedValue(mockHotel as any);
      roomsService.getRoomById.mockResolvedValue(mockRoom as any);
      
      // Mock discount service methods
      discountsService.getDiscountsByIds.mockResolvedValue([]);
      discountsService.decreaseDiscountUsage.mockResolvedValue({} as any);
      
      // Mock findBookingByBusyRoom to return empty array
      jest.spyOn(service, 'findBookingByBusyRoom').mockResolvedValue([]);
      
      const error = new Error('Database error');
      jest.spyOn(service, 'createOne').mockRejectedValue(error);

      // Act & Assert
      await expect(service.createBooking(mockUser, mockCreateBookingDto))
        .rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should find booking by filter successfully', async () => {
      // Arrange
      bookingModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockBooking)
        })
      } as any);

      // Act
      const result = await service.findOne({ _id: mockBooking._id });

      // Assert
      expect(bookingModel.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockBooking);
    });

    it('should return null when booking not found', async () => {
      // Arrange
      bookingModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null)
        })
      } as any);

      // Act
      const result = await service.findOne({ _id: 'invalid-id' });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createOne', () => {
    it('should create one booking successfully', async () => {
      // Arrange
      bookingModel.create = jest.fn().mockResolvedValue(mockBooking);
      
      // Mock findOne for postCreateOne method
      bookingModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockBooking)
        })
      } as any);

      // Act
      const result = await service.createOne(mockBooking);

      // Assert
      expect(bookingModel.create).toHaveBeenCalledWith(mockBooking);
      expect(result).toEqual(mockBooking);
    });
  });

  describe('update', () => {
    it('should update booking successfully', async () => {
      // Arrange
      const updatedBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
      
      // Mock find method calls:
      // 1st call: get old records
      // 2nd call: get new records  
      // 3rd call: postUpdate method
      bookingModel.find
        .mockReturnValueOnce({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockBooking])
          })
        } as any)
        .mockReturnValueOnce({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([updatedBooking])
          })
        } as any)
        .mockReturnValueOnce([updatedBooking] as any); // postUpdate returns find result directly
      
      // Mock updateMany
      bookingModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 })
      } as any);

      // Act
      const result = await service.update({ status: BookingStatus.CANCELLED }, { _id: mockBooking._id });

      // Assert
      expect(bookingModel.find).toHaveBeenCalledWith({ _id: mockBooking._id });
      expect(bookingModel.updateMany).toHaveBeenCalledWith(
        { _id: mockBooking._id },
        expect.objectContaining({
          status: BookingStatus.CANCELLED,
          updateTimestamp: expect.any(Date)
        })
      );
      expect(result).toEqual([updatedBooking]);
    });
  });

  describe('booking statistics', () => {
    it('should get booking count successfully', async () => {
      // Arrange
      bookingModel.countDocuments = jest.fn().mockResolvedValue(10);

      // Act
      const result = await bookingModel.countDocuments({ status: BookingStatus.CONFIRMED });

      // Assert
      expect(bookingModel.countDocuments).toHaveBeenCalledWith({ status: BookingStatus.CONFIRMED });
      expect(result).toBe(10);
    });

    it('should run aggregation pipeline successfully', async () => {
      // Arrange
      const mockStats = [
        { _id: BookingStatus.CONFIRMED, count: 10, totalRevenue: 1000 },
        { _id: BookingStatus.CANCELLED, count: 5, totalRevenue: 500 },
      ];
      bookingModel.aggregate = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await bookingModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalRevenue: { $sum: '$totalPrice' } } }
      ]);

      // Assert
      expect(bookingModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });
});
