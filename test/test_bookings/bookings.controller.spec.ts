import { Test, TestingModule } from '@nestjs/testing';

import { Role } from '@/modules/auth/enums/role.enum';
import { BookingsController } from '@/modules/bookings/controllers/bookings.controller';
import { BookingQueryDtoForAdmin, CreateBookingDto } from '@/modules/bookings/dtos/booking.dto';
import { BookingStatus } from '@/modules/bookings/enums/booking-status.enum';
import { Booking } from '@/modules/bookings/schemas/booking.schema';
import { BookingsService } from '@/modules/bookings/services/bookings.service';
import { MailService } from '@/modules/mail/services/mail.service';
import { PayosService } from '@/modules/payment/services/payment.service';
import { PaymentMethodEnum } from '@/modules/transactions/schemas/transaction.schema';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';
import { User } from '@/modules/users/schemas/user.schema';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: jest.Mocked<BookingsService>;
  let mailService: jest.Mocked<MailService>;
  let payosService: jest.Mocked<PayosService>;
  let transactionsService: jest.Mocked<TransactionsService>;

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: {
            createBooking: jest.fn(),
            findMany: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendBookingConfirmationEmail: jest.fn(),
          },
        },
        {
          provide: PayosService,
          useValue: {
            createPaymentLink: jest.fn(),
          },
        },
        {
          provide: TransactionsService,
          useValue: {
            createTransaction: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    bookingsService = module.get(BookingsService);
    mailService = module.get(MailService);
    payosService = module.get(PayosService);
    transactionsService = module.get(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('BookingHotel', () => {
    it('should create a new booking successfully', async () => {
      // Arrange
      const mockPaymentLinkData = {
        checkoutUrl: 'https://example.com/payment/12345',
        orderId: 'order-123',
      };

      bookingsService.createBooking.mockResolvedValue(mockBooking);
      payosService.createPaymentLink.mockResolvedValue(mockPaymentLinkData);
      mailService.sendBookingConfirmationEmail.mockResolvedValue();

      // Act
      const result = await controller.BookingHotel(mockUser, mockCreateBookingDto);

      // Assert
      expect(bookingsService.createBooking).toHaveBeenCalledWith(mockUser, mockCreateBookingDto);
      expect(payosService.createPaymentLink).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.paymentLink).toBe('https://example.com/payment/12345');
    });

    it('should create booking with payment gateway', async () => {
      // Arrange
      const paymentBooking = { ...mockBooking, paymentMethod: PaymentMethodEnum.PAYMENT_GATEWAY };
      const mockPaymentData = { checkoutUrl: 'https://payment.url' };

      bookingsService.createBooking.mockResolvedValue(paymentBooking);
      transactionsService.createTransaction.mockResolvedValue({} as any);
      payosService.createPaymentLink.mockResolvedValue(mockPaymentData);
      mailService.sendBookingConfirmationEmail.mockResolvedValue();

      // Act
      const result = await controller.BookingHotel(mockUser, mockCreateBookingDto);

      // Assert
      expect(transactionsService.createTransaction).toHaveBeenCalled();
      expect(payosService.createPaymentLink).toHaveBeenCalledWith(paymentBooking);
      expect(result).toEqual(
        expect.objectContaining({
          paymentLink: mockPaymentData.checkoutUrl,
        }),
      );
    });

    it('should handle booking creation failure', async () => {
      // Arrange
      const error = new Error('Booking creation failed');
      bookingsService.createBooking.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.BookingHotel(mockUser, mockCreateBookingDto)).rejects.toThrow(
        'Booking creation failed',
      );
    });
  });

  describe('GetAll', () => {
    it('should get all bookings successfully', async () => {
      // Arrange
      const mockBookings = [mockBooking];
      const queryDto: BookingQueryDtoForAdmin = {
        page: 1,
        pageSize: 10,
        order: ['createdAt'],
      };
      const mockResult = {
        data: mockBookings,
        metadata: {
          pagination: {
            currentPage: 1,
            pageSize: 10,
            total: 1,
            totalPage: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          filters: {},
          order: [{ field: 'createdAt', direction: 'asc' }],
        },
      };
      bookingsService.find.mockResolvedValue(mockResult);

      // Act
      const result = await controller.GetAll(mockUser, queryDto);

      // Assert
      expect(bookingsService.find).toHaveBeenCalledWith({ queryDto: queryDto }, mockUser);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it('should handle query filters', async () => {
      // Arrange
      const mockBookings = [mockBooking];
      const queryDto: BookingQueryDtoForAdmin = {
        status: BookingStatus.CONFIRMED,
        userId: 'user-id-123',
        page: 1,
        pageSize: 10,
        order: ['createdAt'],
      };
      const mockResult = {
        data: mockBookings,
        metadata: {
          pagination: {
            currentPage: 1,
            pageSize: 10,
            total: 1,
            totalPage: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          filters: { status: BookingStatus.CONFIRMED, userId: 'user-id-123' },
          order: [{ field: 'createdAt', direction: 'asc' }],
        },
      };
      bookingsService.find.mockResolvedValue(mockResult);

      // Act
      const result = await controller.GetAll(mockUser, queryDto);

      // Assert
      expect(bookingsService.find).toHaveBeenCalledWith({ queryDto: queryDto }, mockUser);
      expect(result).toBeDefined();
    });
  });

  describe('updateHotel', () => {
    it('should update booking successfully', async () => {
      // Arrange
      const updateDto = { status: BookingStatus.CANCELLED };
      const updatedBookings = [{ ...mockBooking, status: BookingStatus.CANCELLED }];
      bookingsService.update.mockResolvedValue(updatedBookings as any);

      // Act
      const result = await controller.updateHotel(mockUser, mockBooking._id, updateDto);

      // Assert
      expect(bookingsService.update).toHaveBeenCalledWith(
        { ...updateDto },
        { _id: mockBooking._id },
        mockUser,
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result) ? result[0].status : result.status).toBe(
        BookingStatus.CANCELLED,
      );
    });

    it('should handle update failure', async () => {
      // Arrange
      const updateDto = { status: BookingStatus.CANCELLED };
      const error = new Error('Update failed');
      bookingsService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.updateHotel(mockUser, mockBooking._id, updateDto)).rejects.toThrow(
        'Update failed',
      );
    });
  });
});
