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
};
