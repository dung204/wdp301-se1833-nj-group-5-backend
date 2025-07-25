import { Role } from '@/modules/auth/enums/role.enum';
import { Gender } from '@/modules/users/enums/gender.enum';

export const SwaggerExamples = {
  FULLNAME: 'John Doe',
  EMAIL: 'email@example.com',
  PASSWORD: 'password@123456',
  UUID: '9efdce14-b81e-4d03-ad6e-cf95f64667fa',
  JWT_ACCESS_TOKEN:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZWZkY2UxNC1iODFlLTRkMDMtYWQ2ZS1jZjk1ZjY0NjY3ZmEifQ.JUZkSX-7jF9TAZXjE7Eh5MS8zRcrhCvoiLYp2NrhZZs',
  JWT_REFRESH_TOKEN:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZWZkY2UxNC1iODFlLTRkMDMtYWQ2ZS1jZjk1ZjY0NjY3ZmEifQ.I_6pMfuFDeLXbZOhyTddcNdpEQ_X9DkXjoGEOAKCmxs',
  ROLE: Role.CUSTOMER,
  GENDER: Gender.MALE,
  DATE_FROM: '2025-01-01T00:00:00Z',
  DATE_TO: '2025-12-31T23:59:59Z',
  ORDER_VALUE: 'createTimestamp:DESC',
  ORDER_FIELD: 'createTimestamp',
  ORDER_DIRECTION: 'DESC',
  ACCEPT_HOTEL: ['HOTEL1_ID', 'HOTEL2_ID'],
  FILENAME: 'a.png',
  URL: 'https://example.com',

  // Booking related examples
  HOTEL_ID: '84d67269-7470-4ef1-bfbb-c66e7cf8c955',
  ROOM_ID: 'cb3703a9-7ef3-4a8d-bf54-5599ce17c107',
  CHECK_IN_DATE: '2025-01-15T14:00:00.000Z',
  CHECK_OUT_DATE: '2025-01-18T12:00:00.000Z',
  BOOKING_QUANTITY: 2,
  MIN_OCCUPANCY: 1,
  TOTAL_PRICE: 450000,
  PAYMENT_URL: 'https://pay.payos.vn/web/123456789',
  ORDER_CODE: 123456789,

  // Hotel related examples
  HOTEL_NAME: 'Grand Hotel',
  HOTEL_PROVINCE: 'Hà Nội',
  HOTEL_COMMUNE: 'Phường Hoàn Kiếm',
  HOTEL_ADDRESS: '123 Main Street',
  HOTEL_DESCRIPTION: 'A luxurious hotel with amazing views',
  HOTEL_PHONE: '+84123456789',
  HOTEL_PRICE: 150000,
  HOTEL_RATING: 4.5,
  HOTEL_SERVICES: ['wifi', 'pool', 'parking', 'breakfast'],
  HOTEL_CHECKIN_TIME: {
    from: '2023-01-01T14:00:00Z',
    to: '2023-01-01T22:00:00Z',
  },
  HOTEL_CHECKOUT_TIME: '2023-01-01T12:00:00Z',
  SEARCH_TERM: 'Ha Noi',

  // Room related examples
  ROOM_NAME: 'Deluxe Ocean View Suite',
  ROOM_RATE: 150,
  ROOM_SIZE: 35,
  ROOM_OCCUPANCY: 2,
  ROOM_MAX_QUANTITY: 5,
  ROOM_SERVICES: ['free wifi', 'minibar', 'air conditioning', 'TV'],
  ROOM_TOTAL_AVAILABLE: 10,
  ROOM_BOOKED: 7,
  ROOM_AVAILABLE: 3,

  // Revenue related examples
  REVENUE_DATE: '2024-01-15T00:00:00.000Z',
  TOTAL_REVENUE: 2500000,
  TOTAL_BOOKINGS: 8,
  YEAR: 2025,
  MONTH: 6,
  MIN_REVENUE: 1000000,
  MAX_REVENUE: 5000000,
  YEARLY_REVENUE: 50000000,
  YEARLY_BOOKINGS: 150,
  MONTHLY_REVENUE: 5000000,
  MONTHLY_BOOKINGS: 15,

  // Discount related examples
  DISCOUNT_TITLE: '10% discount when traveling',
  DISCOUNT_ID: '29845802-9abb-474b-96b4-e2c44b6bf089',
  DISCOUNT_AMOUNT: 10,
  DISCOUNT_USAGE_COUNT: 100,
  DISCOUNT_MAX_QUALITY_PER_USER: 1,
  DISCOUNT_MIN_AMOUNT: 5,
};
