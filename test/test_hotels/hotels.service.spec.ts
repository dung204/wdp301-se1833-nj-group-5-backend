import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { Role } from '@/modules/auth/enums/role.enum';
import { CreateHotelDto } from '@/modules/hotels/dtos/hotel.dto';
import { CancelEnum } from '@/modules/hotels/enums';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { MinioStorageService } from '@/modules/minio-storage/minio-storage.service';
import { RoomsService } from '@/modules/rooms/services/rooms.service';
import { User } from '@/modules/users/schemas/user.schema';

describe('HotelsService', () => {
  let service: HotelsService;
  let hotelModel: jest.Mocked<Model<Hotel>>;
  let minioStorageService: jest.Mocked<MinioStorageService>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelsService,
        {
          provide: getModelToken(Hotel.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            aggregate: jest.fn(),
            countDocuments: jest.fn(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn(),
          },
        },
        {
          provide: MinioStorageService,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        {
          provide: RoomsService,
          useValue: {
            find: jest.fn(),
            deleteMany: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HotelsService>(HotelsService);
    hotelModel = module.get(getModelToken(Hotel.name)) as jest.Mocked<Model<Hotel>>;
    minioStorageService = module.get<MinioStorageService>(
      MinioStorageService,
    ) as jest.Mocked<MinioStorageService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(hotelModel).toBeDefined();
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

      const mockImages: Express.Multer.File[] = [];

      minioStorageService.uploadFile.mockResolvedValue({ fileName: 'test-image.jpg' } as any);
      const mockCreateOne = jest.spyOn(service, 'createOne').mockResolvedValue(mockHotel);

      // Act
      const result = await service.createHotel(mockUser, createHotelDto, mockImages);

      // Assert
      expect(mockCreateOne).toHaveBeenCalled();
      expect(result).toEqual(mockHotel);
    });
  });

  describe('getHotelsByOwnerId', () => {
    it('should get hotels by owner id successfully', async () => {
      // Arrange
      const mockHotels = [mockHotel];
      hotelModel.find.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockHotels),
        }),
      } as any);

      // Act
      const result = await service.getHotelsByOwnerId(mockUser._id);

      // Assert
      expect(hotelModel.find).toHaveBeenCalledWith({
        owner: mockUser._id,
        deleteTimestamp: null,
      });
      expect(result).toEqual(mockHotels);
    });
  });

  describe('searchHotelsWithAvailability', () => {
    it('should search hotels with availability successfully', async () => {
      // Arrange
      const queryDto = {
        page: 1,
        pageSize: 10,
        order: ['createTimestamp:asc'],
        checkIn: new Date('2025-07-14T14:00:00.000Z'),
        checkOut: new Date('2025-07-15T14:00:00.000Z'),
      };
      const checkIn = new Date('2025-07-14T14:00:00.000Z');
      const checkOut = new Date('2025-07-15T14:00:00.000Z');

      const mockAggregateResult = [
        {
          _id: mockHotel._id,
          totalRooms: 5,
          totalBookedRooms: 2,
          availableRooms: 3,
        },
      ];

      hotelModel.aggregate.mockResolvedValue(mockAggregateResult);

      // Act
      const result = await service.searchHotelsWithAvailability(queryDto, checkIn, checkOut);

      // Assert
      expect(hotelModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual(mockAggregateResult);
    });
  });
});
