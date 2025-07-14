import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, DiscoveryModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { ConfigModule } from './base/configs/config.module';
import { DatabaseModule } from './base/database/database.module';
import { ImageTransformInterceptor } from './base/interceptors/image-transform.interceptor';
import { ResponseTransformInterceptor } from './base/interceptors/response-transform.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { JwtGuard } from './modules/auth/guards/jwt.guard';
import { BookingsModule } from './modules/bookings/bookings.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { MinioStorageModule } from './modules/minio-storage/minio-storage.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { PaymentsModule } from './modules/payment/payment.module';
import { RevenueModule } from './modules/revenue-report/revenue.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DiscoveryModule,
    AuthModule,
    DatabaseModule,
    UsersModule,
    HotelsModule,
    RoomsModule,
    BookingsModule,
    TransactionsModule,
    PaymentMethodsModule,
    DiscountsModule,
    ReviewsModule,
    RevenueModule,
    PaymentsModule,
    MinioStorageModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ImageTransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
  ],
})
export class AppModule {}
