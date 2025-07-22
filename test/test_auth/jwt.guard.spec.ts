import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { Role } from '@/modules/auth/enums/role.enum';
import { JwtGuard } from '@/modules/auth/guards/jwt.guard';
import { User } from '@/modules/users/schemas/user.schema';

describe('JwtGuard', () => {
  let guard: JwtGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockUser: User = {
    _id: 'user-id-123',
    email: 'test@example.com',
    role: Role.CUSTOMER,
  } as User;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: mockUser,
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtGuard>(JwtGuard);
    reflector = module.get(Reflector);

    // Mock the parent canActivate method
    jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access to public routes', async () => {
      // Arrange
      reflector.getAllAndOverride
        .mockReturnValueOnce(true) // isPublic
        .mockReturnValueOnce(undefined) // allowRoles
        .mockReturnValueOnce(undefined); // optionalAuth

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user has correct role', async () => {
      // Arrange
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic
        .mockReturnValueOnce([Role.CUSTOMER, Role.ADMIN]) // allowRoles
        .mockReturnValueOnce(undefined); // optionalAuth

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user has incorrect role', async () => {
      // Arrange
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic
        .mockReturnValueOnce([Role.ADMIN]) // allowRoles (CUSTOMER not included)
        .mockReturnValueOnce(undefined); // optionalAuth

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access for optional auth when not authenticated', async () => {
      // Arrange
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic
        .mockReturnValueOnce(undefined) // allowRoles
        .mockReturnValueOnce([Role.CUSTOMER]); // optionalAuth

      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockResolvedValue(false);

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when not authenticated and not public/optional', async () => {
      // Arrange
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic
        .mockReturnValueOnce([Role.CUSTOMER]) // allowRoles
        .mockReturnValueOnce(undefined); // optionalAuth

      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockResolvedValue(false);

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(false);
    });
  });
});
