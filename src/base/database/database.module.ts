import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { configs } from '@/base/configs';

import { RedisService } from './services/redis.service';

@Global()
@Module({
  imports: [
    MongooseModule.forRoot(configs.MONGO_URI, {
      retryAttempts: 10,
      retryDelay: 2000,
      timeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class DatabaseModule {}
