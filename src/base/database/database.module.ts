import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { configs } from '../configs/config.service';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  imports: [TypeOrmModule.forRoot(configs.POSTGRES)],
  providers: [RedisService],
  exports: [RedisService],
})
export class DatabaseModule {}
