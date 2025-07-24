# Auth Module Unit Tests

Thư mục này chứa các unit tests cho auth module của ứng dụng.

## Cấu trúc file test

```
test/test_auth/
├── auth.service.spec.ts      # Test cho AuthService
├── auth.controller.spec.ts   # Test cho AuthController
├── jwt.strategy.spec.ts      # Test cho JwtStrategy
└── jwt.guard.spec.ts         # Test cho JwtGuard
```

## Chạy tests

### Chạy tất cả tests trong project

```bash
npm test
```

### Chạy tests với watch mode

```bash
npm run test:watch
```

### Chạy tests với coverage

```bash
npm run test:cov
```

### Chạy chỉ auth tests

```bash
npm test -- --testPathPattern=test_auth
```

### Chạy một file test cụ thể

```bash
npm test -- auth.service.spec.ts
```

## Test Coverage

Các tests cover các scenarios sau:

### AuthService

- ✅ Login thành công với credentials hợp lệ
- ✅ Login thất bại với user không tồn tại
- ✅ Login thất bại với password sai
- ✅ Register user mới thành công
- ✅ Register thất bại với email đã tồn tại
- ✅ Restore user đã bị soft delete
- ✅ Refresh token thành công
- ✅ Refresh token bị blacklist
- ✅ Logout thành công
- ✅ Blacklist token
- ✅ Check token blacklist status

### AuthController

- ✅ Login endpoint
- ✅ Register endpoint
- ✅ Refresh token endpoint
- ✅ Logout endpoint

### JwtStrategy

- ✅ Validate JWT payload thành công
- ✅ Validate thất bại khi user không tồn tại
- ✅ Validate thất bại khi user bị soft delete

### JwtGuard

- ✅ Allow access cho public routes
- ✅ Allow access khi user có đúng role
- ✅ Deny access khi user không có đúng role
- ✅ Allow access cho optional auth
- ✅ Deny access khi không authenticated

## Mocking

Tests sử dụng Jest mocks cho:

- `UsersService`
- `RedisService`
- `JwtService`
- `PasswordUtils`

## Setup

Tests được setup với:

- Test environment: `node`
- Module path mapping: `@/*` -> `src/*`
- Setup file: `test/setup.ts`
- Coverage output: `coverage/`
