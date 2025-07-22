import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Role } from '@/modules/auth/enums/role.enum';
import { AuthService } from '@/modules/auth/services/auth.service';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { User } from '@/modules/users/schemas/user.schema';
import { UsersService } from '@/modules/users/services/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: User = {
    _id: 'user-id-123',
    email: 'test@example.com',
    role: Role.CUSTOMER,
    deleteTimestamp: null,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: {
            isTokenBlacklisted: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get(AuthService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const payload = {
      sub: 'user-id-123',
    };

    it('should validate and return user', async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(usersService.findOne).toHaveBeenCalledWith({
        _id: payload.sub,
        deleteTimestamp: null,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is soft deleted', async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(null); // findOne với deleteTimestamp: null sẽ không tìm thấy

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
