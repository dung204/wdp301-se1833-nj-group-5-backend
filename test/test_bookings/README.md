# Bookings Module Unit Tests

Thư mục này chứa các unit tests cho bookings module của ứng dụng.

## Cấu trúc file test

```
test/test_bookings/
├── bookings.service.spec.ts      # Test cho BookingsService
├── bookings.controller.spec.ts   # Test cho BookingsController
└── README.md                     # Hướng dẫn sử dụng
```

## Test Coverage

### BookingsService

- ✅ Create booking
- ✅ Find one booking
- ✅ Create one booking
- ✅ Update booking
- ✅ Booking statistics và aggregation

### BookingsController

- ✅ BookingHotel endpoint
- ✅ GetAll endpoint
- ✅ updateHotel endpoint
- ✅ Payment gateway integration
- ✅ Email notification

## Chạy tests

```bash
# Chạy bookings tests
npm test -- --testPathPattern=test_bookings

# Chạy một file test cụ thể
npm test -- bookings.service.spec.ts
```
