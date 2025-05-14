import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

import { configs } from '@/base/configs/config.service';

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    const { host, port, ...redisConfigs } = configs.REDIS;
    this.redis = new Redis(port, host, {
      ...redisConfigs,
      retryStrategy: (times) => Math.min(times * 2000, 10000),
      maxRetriesPerRequest: 10,
    });
  }

  async set(key: string, value: string, ttl?: number) {
    try {
      await this.redis.set(key, value);
      if (ttl) await this.redis.expire(key, ttl);
      this.logger.log(`String: Set key ${key} with value ${value}`);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  get(key: string, deleteAfterGet?: boolean) {
    try {
      this.logger.log(`String: Get key ${key}${deleteAfterGet ? ' then delete' : ''}`);
      if (deleteAfterGet) {
        return this.redis.getdel(key);
      }
      return this.redis.get(key);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async del(key: string) {
    try {
      this.logger.log(`String: Delete key ${key}`);
      return await this.redis.del(key);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async delMultiPrefix(prefix: string) {
    try {
      this.logger.log(`All: Delete multi key with prefix ${prefix}`);
      const keys = [];
      let cursor = '0';

      do {
        const result = await this.redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== '0');
      if (keys.length === 0) return;
      await this.redis.del(...keys);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
