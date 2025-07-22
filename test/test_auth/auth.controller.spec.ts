import { Test, TestingModule } from '@nestjs/testing';

import { CustomRequest } from '@/base/dtos';
import { AuthController } from '@/modules/auth/controllers/auth.controller';
import { Role } from '@/modules/auth/enums/role.enum';
import { AuthService } from '@/modules/auth/services/auth.service';
import { Gender } from '@/modules/users/enums/gender.enum';
import { User } from '@/modules/users/schemas/user.schema';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockLoginResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 'user-id-123',
      role: Role.CUSTOMER,
      fullName: 'Test User',
      gender: Gender.MALE,
    },
  };

  const mockUser: User = {
    _id: 'user-id-123',
    email: 'test@example.com',
    role: Role.CUSTOMER,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully', async () => {
      // Arrange
      authService.login.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle login failure', async () => {
      // Arrange
      const error = new Error('Login failed');
      authService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(error);
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
    };

    it('should register successfully', async () => {
      // Arrange
      authService.register.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle registration failure', async () => {
      // Arrange
      const error = new Error('Registration failed');
      authService.register.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(error);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh token successfully', async () => {
      // Arrange
      authService.refresh.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await controller.refreshToken(refreshTokenDto);

      // Assert
      expect(authService.refresh).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle refresh token failure', async () => {
      // Arrange
      const error = new Error('Refresh failed');
      authService.refresh.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.refreshToken(refreshTokenDto)).rejects.toThrow(error);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Arrange
      const mockRequest = {
        user: mockUser,
        headers: {
          authorization: 'Bearer access-token',
        },
      } as unknown as CustomRequest;
      authService.logout.mockResolvedValue(undefined);

      // Act
      await controller.logout(mockRequest);

      // Assert
      expect(authService.logout).toHaveBeenCalledWith(mockUser, 'access-token');
    });

    it('should handle logout failure', async () => {
      // Arrange
      const mockRequest = {
        user: mockUser,
        headers: {
          authorization: 'Bearer access-token',
        },
      } as unknown as CustomRequest;
      const error = new Error('Logout failed');
      authService.logout.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.logout(mockRequest)).rejects.toThrow(error);
    });
  });
});
