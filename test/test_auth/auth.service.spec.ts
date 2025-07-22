import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { RedisService } from '@/base/database';
import { PasswordUtils } from '@/base/utils/password.utils';
import { Role } from '@/modules/auth/enums/role.enum';
import { AuthService } from '@/modules/auth/services/auth.service';
import { Gender } from '@/modules/users/enums/gender.enum';
import { User } from '@/modules/users/schemas/user.schema';
import { UsersService } from '@/modules/users/services/users.service';

// Mock PasswordUtils
jest.mock('@/base/utils/password.utils');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let redisService: jest.Mocked<RedisService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    _id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashed-password',
    fullName: 'Test User',
    role: Role.CUSTOMER,
    gender: Gender.MALE,
    deleteTimestamp: null,
    createTimestamp: new Date(),
    updateTimestamp: new Date(),
  } as User;

  const mockLoginDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockRegisterDto = {
    email: 'newuser@example.com',
    password: 'password123',
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            createOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    redisService = module.get(RedisService);
    jwtService = module.get(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(mockUser);
      (PasswordUtils.isMatchPassword as jest.Mock).mockReturnValue(true);
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken);
      jwtService.sign.mockReturnValueOnce(mockTokens.refreshToken);
      redisService.set.mockResolvedValue(undefined);

      // Act
      const result = await service.login(mockLoginDto);

      // Assert
      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        user: {
          id: mockUser._id,
          role: mockUser.role,
          fullName: mockUser.fullName,
          gender: mockUser.gender,
        },
      });
      expect(usersService.findOne).toHaveBeenCalledWith({ email: mockLoginDto.email });
      expect(PasswordUtils.isMatchPassword).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUser.password,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException('Email or password is incorrect.'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith({ email: mockLoginDto.email });
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(mockUser);
      (PasswordUtils.isMatchPassword as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException('Email or password is incorrect.'),
      );
      expect(PasswordUtils.isMatchPassword).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUser.password,
      );
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(null);
      (PasswordUtils.hashPassword as jest.Mock).mockReturnValue('hashed-password');
      usersService.createOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken);
      jwtService.sign.mockReturnValueOnce(mockTokens.refreshToken);
      redisService.set.mockResolvedValue(undefined);

      // Act
      const result = await service.register(mockRegisterDto);

      // Assert
      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        user: {
          id: mockUser._id,
          role: mockUser.role,
          fullName: mockUser.fullName,
          gender: mockUser.gender,
        },
      });
      expect(usersService.findOne).toHaveBeenCalledWith({ email: mockRegisterDto.email });
      expect(PasswordUtils.hashPassword).toHaveBeenCalledWith(mockRegisterDto.password);
      expect(usersService.createOne).toHaveBeenCalledWith({
        _id: expect.any(String),
        email: mockRegisterDto.email,
        password: 'hashed-password',
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        new ConflictException('Email has already been registered.'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith({ email: mockRegisterDto.email });
    });

    it('should restore soft-deleted user', async () => {
      // Arrange
      const deletedUser = { ...mockUser, deleteTimestamp: new Date() };
      usersService.findOne.mockResolvedValue(deletedUser);
      (PasswordUtils.hashPassword as jest.Mock).mockReturnValue('hashed-password');
      usersService.update.mockResolvedValue([mockUser] as any);
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken);
      jwtService.sign.mockReturnValueOnce(mockTokens.refreshToken);
      redisService.set.mockResolvedValue(undefined);

      // Act
      const result = await service.register(mockRegisterDto);

      // Assert
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(usersService.update).toHaveBeenCalledWith({
        ...deletedUser,
        ...mockRegisterDto,
        password: 'hashed-password',
        deleteTimestamp: null,
      });
    });
  });

  describe('refresh', () => {
    const refreshToken = 'valid-refresh-token';

    it('should successfully refresh token', async () => {
      // Arrange
      jest.spyOn(service, 'isTokenBlacklisted').mockResolvedValue(false);
      jwtService.verify.mockReturnValue({ sub: mockUser._id });
      usersService.findOne.mockResolvedValue(mockUser);
      jest.spyOn(service, 'blacklistToken').mockResolvedValue(undefined);
      jwtService.sign.mockReturnValueOnce('new-access-token');
      jwtService.sign.mockReturnValueOnce('new-refresh-token');
      redisService.set.mockResolvedValue(undefined);

      // Act
      const result = await service.refresh(refreshToken);

      // Assert
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: mockUser._id,
          role: mockUser.role,
          fullName: mockUser.fullName,
          gender: mockUser.gender,
        },
      });
      expect(service.isTokenBlacklisted).toHaveBeenCalledWith(refreshToken);
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: expect.any(String),
      });
    });

    it('should throw UnauthorizedException when refresh token is blacklisted', async () => {
      // Arrange
      jest.spyOn(service, 'isTokenBlacklisted').mockResolvedValue(true);

      // Act & Assert
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Refresh token is blacklisted.'),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      jest.spyOn(service, 'isTokenBlacklisted').mockResolvedValue(false);
      jwtService.verify.mockReturnValue({ sub: 'invalid-user-id' });
      usersService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        new NotFoundException('User not found.'),
      );
    });
  });

  describe('logout', () => {
    const accessToken = 'access-token';

    it('should successfully logout', async () => {
      // Arrange
      redisService.get.mockResolvedValue('refresh-token');
      jest.spyOn(service, 'blacklistToken').mockResolvedValue(undefined);

      // Act
      await service.logout(mockUser, accessToken);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(`REFRESH_TOKEN_${mockUser._id}`, true);
      expect(service.blacklistToken).toHaveBeenCalledWith(accessToken);
      expect(service.blacklistToken).toHaveBeenCalledWith('refresh-token');
    });

    it('should logout without refresh token', async () => {
      // Arrange
      redisService.get.mockResolvedValue(null);
      jest.spyOn(service, 'blacklistToken').mockResolvedValue(undefined);

      // Act
      await service.logout(mockUser, accessToken);

      // Assert
      expect(service.blacklistToken).toHaveBeenCalledTimes(1);
      expect(service.blacklistToken).toHaveBeenCalledWith(accessToken);
    });
  });

  describe('blacklistToken', () => {
    it('should blacklist token successfully', async () => {
      // Arrange
      const token = 'some-token';
      const decodedToken = { exp: Math.floor(Date.now() / 1000) + 3600 };
      jwtService.decode.mockReturnValue(decodedToken);
      redisService.set.mockResolvedValue(undefined);

      // Act
      await service.blacklistToken(token);

      // Assert
      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(redisService.set).toHaveBeenCalledWith(token, 'BLACKLISTED', expect.any(Number));
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true when token is blacklisted', async () => {
      // Arrange
      const token = 'blacklisted-token';
      redisService.get.mockResolvedValue('BLACKLISTED');

      // Act
      const result = await service.isTokenBlacklisted(token);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(token);
      expect(result).toBe(true);
    });

    it('should return false when token is not blacklisted', async () => {
      // Arrange
      const token = 'valid-token';
      redisService.get.mockResolvedValue(null);

      // Act
      const result = await service.isTokenBlacklisted(token);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(token);
      expect(result).toBe(false);
    });
  });
});
