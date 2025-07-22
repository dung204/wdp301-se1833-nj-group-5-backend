import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { Role } from '@/modules/auth/enums/role.enum';
import { HotelsController } from '@/modules/hotels/controllers/hotels.controller';
import {
  CreateHotelDto,
  HotelQueryDto,
  HotelQueryDtoForAdmin,
  UpdateHotelDto,
} from '@/modules/hotels/dtos/hotel.dto';
import { CancelEnum } from '@/modules/hotels/enums';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { User } from '@/modules/users/schemas/user.schema';

describe('HotelsController', () => {
  let controller: HotelsController;
  let service: jest.Mocked<HotelsService>;

  const mockUser: User = {
    _id: 'user-id-123',
    email: 'hotel-owner@example.com',
    role: Role.HOTEL_OWNER,
    fullName: 'Hotel Owner',
  } as User;

  const mockHotel: Hotel = {
    _id: 'hotel-id-123',
    name: 'Test Hotel',
    province: 'Test Province',
    commune: 'Test Commune',
    address: 'Test Address',
    description: 'Test Description',
    owner: mockUser,
    phoneNumber: '+84123456789',
    priceHotel: 100,
    cancelPolicy: CancelEnum.REFUND_BEFORE_1_DAY,
    checkinTime: {
      from: new Date('2023-01-01T14:00:00Z'),
      to: new Date('2023-01-01T22:00:00Z'),
    },
    checkoutTime: new Date('2023-01-01T12:00:00Z'),
    images: [],
    rating: 4.5,
    createTimestamp: new Date(),
    updateTimestamp: new Date(),
    deleteTimestamp: null,
  } as unknown as Hotel;

  const mockImages: Express.Multer.File[] = [
    {
      fieldname: 'images',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
    } as Express.Multer.File,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelsController],
      providers: [
        {
          provide: HotelsService,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createHotel: jest.fn(),
            update: jest.fn(),
            deleteHotel: jest.fn(),
            restore: jest.fn(),
            searchHotelsWithAvailability: jest.fn(),
          },
        },
        {
          provide: getModelToken(Hotel.name),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<HotelsController>(HotelsController);
    service = module.get<HotelsService>(HotelsService) as jest.Mocked<HotelsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchHotels', () => {
    it('should search hotels successfully', async () => {
      // Arrange
      const queryDto: HotelQueryDto = {
        page: 1,
        pageSize: 10,
        order: ['createTimestamp:asc'],
        checkIn: new Date('2025-07-14T14:00:00.000Z'),
        checkOut: new Date('2025-07-15T14:00:00.000Z'),
      };

      const mockResult = {
        data: [mockHotel],
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
          order: [{ field: 'createTimestamp', direction: 'asc' }],
        },
      };

      service.find.mockResolvedValue(mockResult);
      service.searchHotelsWithAvailability.mockResolvedValue([]);

      // Act
      const result = await controller.searchHotels(queryDto);

      // Assert
      expect(service.find).toHaveBeenCalledWith({
        queryDto,
        filter: { deleteTimestamp: null },
      });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
    });
  });

  describe('getAllHotelsForAdmin', () => {
    it('should get all hotels for admin successfully', async () => {
      // Arrange
      const adminUser = { ...mockUser, role: Role.ADMIN };
      const queryDto: HotelQueryDtoForAdmin = {
        page: 1,
        pageSize: 10,
        order: ['createTimestamp:asc'],
        checkIn: new Date('2025-07-14T14:00:00.000Z'),
        checkOut: new Date('2025-07-15T14:00:00.000Z'),
      };

      const mockResult = {
        data: [mockHotel],
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
          order: [{ field: 'createTimestamp', direction: 'asc' }],
        },
      };

      service.find.mockResolvedValue(mockResult);
      service.searchHotelsWithAvailability.mockResolvedValue([]);

      // Act
      const result = await controller.getAllHotelsForAdmin(adminUser, queryDto);

      // Assert
      expect(service.find).toHaveBeenCalledWith(
        {
          queryDto,
        },
        adminUser,
      );
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
    });
  });

  describe('createHotel', () => {
    it('should create a new hotel successfully', async () => {
      // Arrange
      const createHotelDto: CreateHotelDto = {
        name: 'Test Hotel',
        province: 'Test Province',
        commune: 'Test Commune',
        address: 'Test Address',
        description: 'Test Description',
        phoneNumber: '+84123456789',
        priceHotel: 100,
        cancelPolicy: CancelEnum.REFUND_BEFORE_1_DAY,
        checkinTime: {
          from: new Date('2023-01-01T14:00:00Z'),
          to: new Date('2023-01-01T22:00:00Z'),
        },
        checkoutTime: new Date('2023-01-01T12:00:00Z'),
        rating: 4.5,
      };

      service.createHotel.mockResolvedValue(mockHotel);

      // Act
      const result = await controller.createHotel(mockImages, mockUser, createHotelDto);

      // Assert
      expect(service.createHotel).toHaveBeenCalledWith(mockUser, createHotelDto, mockImages);
      expect(result).toBeDefined();
    });

    it('should throw error when hotel creation fails', async () => {
      // Arrange
      const createHotelDto: CreateHotelDto = {
        name: 'Test Hotel',
        province: 'Test Province',
        commune: 'Test Commune',
        address: 'Test Address',
        description: 'Test Description',
        phoneNumber: '+84123456789',
        priceHotel: 100,
        cancelPolicy: CancelEnum.REFUND_BEFORE_1_DAY,
        checkinTime: {
          from: new Date('2023-01-01T14:00:00Z'),
          to: new Date('2023-01-01T22:00:00Z'),
        },
        checkoutTime: new Date('2023-01-01T12:00:00Z'),
        rating: 4.5,
      };

      const error = new Error('Database error');
      service.createHotel.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.createHotel(mockImages, mockUser, createHotelDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('updateHotel', () => {
    it('should update hotel successfully', async () => {
      // Arrange
      const hotelId = 'hotel-id-123';
      const updateDto: UpdateHotelDto = {
        name: 'Updated Hotel',
        description: 'Updated Description',
        newImages: [],
        imagesToDelete: [],
      };

      const updatedHotel = { ...mockHotel, ...updateDto };
      service.update.mockResolvedValue([updatedHotel] as any);

      // Act
      const result = await controller.updateHotel([], mockUser, hotelId, updateDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        { ...updateDto, newImages: [] },
        { _id: hotelId },
        mockUser,
      );
      expect(result).toBeDefined();
    });

    it('should handle update failure', async () => {
      // Arrange
      const hotelId = 'hotel-id-123';
      const updateDto: UpdateHotelDto = {
        name: 'Updated Hotel',
        newImages: [],
        imagesToDelete: [],
      };

      const error = new Error('Update failed');
      service.update.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.updateHotel([], mockUser, hotelId, updateDto)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('deleteHotel', () => {
    it('should delete hotel successfully', async () => {
      // Arrange
      const hotelId = 'hotel-id-123';
      service.deleteHotel.mockResolvedValue(undefined);

      // Act
      const result = await controller.deleteHotel(mockUser, hotelId);

      // Assert
      expect(service.deleteHotel).toHaveBeenCalledWith(mockUser, hotelId);
      expect(result).toBeUndefined();
    });

    it('should handle deletion error', async () => {
      // Arrange
      const hotelId = 'hotel-id-123';
      const error = new Error('Deletion failed');
      service.deleteHotel.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.deleteHotel(mockUser, hotelId)).rejects.toThrow('Deletion failed');
    });
  });

  describe('restoreHotel', () => {
    it('should restore hotel successfully', async () => {
      // Arrange
      const hotelId = 'hotel-id-123';
      service.restore.mockResolvedValue([mockHotel] as any);

      // Act
      const result = await controller.restoreHotel(hotelId, mockUser);

      // Assert
      expect(service.restore).toHaveBeenCalledWith({ _id: hotelId }, mockUser);
      expect(result).toBeDefined();
    });

    it('should handle restore failure', async () => {
      // Arrange
      const hotelId = 'hotel-id-123';
      const error = new Error('Restore failed');
      service.restore.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.restoreHotel(hotelId, mockUser)).rejects.toThrow('Restore failed');
    });
  });

  describe('role-based access', () => {
    it('should allow hotel owner to access their hotels', async () => {
      // Arrange
      const queryDto: HotelQueryDtoForAdmin = {
        page: 1,
        pageSize: 10,
        order: ['createTimestamp:asc'],
        checkIn: new Date('2025-07-14T14:00:00.000Z'),
        checkOut: new Date('2025-07-15T14:00:00.000Z'),
      };

      const mockResult = {
        data: [mockHotel],
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
          order: [{ field: 'createTimestamp', direction: 'asc' }],
        },
      };

      service.find.mockResolvedValue(mockResult);
      service.searchHotelsWithAvailability.mockResolvedValue([]);

      // Act
      const result = await controller.getAllHotelsForAdmin(mockUser, queryDto);

      // Assert
      expect(service.find).toHaveBeenCalledWith({ queryDto }, mockUser);
      expect(result.data).toBeDefined();
    });

    it('should allow admin to access all hotels', async () => {
      // Arrange
      const adminUser = { ...mockUser, role: Role.ADMIN };
      const queryDto: HotelQueryDtoForAdmin = {
        page: 1,
        pageSize: 10,
        order: ['createTimestamp:asc'],
        checkIn: new Date('2025-07-14T14:00:00.000Z'),
        checkOut: new Date('2025-07-15T14:00:00.000Z'),
      };

      const mockResult = {
        data: [mockHotel],
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
          order: [{ field: 'createTimestamp', direction: 'asc' }],
        },
      };

      service.find.mockResolvedValue(mockResult);
      service.searchHotelsWithAvailability.mockResolvedValue([]);

      // Act
      const result = await controller.getAllHotelsForAdmin(adminUser, queryDto);

      // Assert
      expect(service.find).toHaveBeenCalledWith({ queryDto }, adminUser);
      expect(result).toEqual({
        data: expect.any(Array),
        metadata: mockResult.metadata,
      });
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Arrange
      const queryDto: HotelQueryDto = {
        page: 1,
        pageSize: 10,
        order: ['createTimestamp:asc'],
        checkIn: new Date('2025-07-14T14:00:00.000Z'),
        checkOut: new Date('2025-07-15T14:00:00.000Z'),
      };

      const error = new Error('Service error');
      service.find.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.searchHotels(queryDto)).rejects.toThrow('Service error');
    });
  });

  // Add simple test to ensure file has tests
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
