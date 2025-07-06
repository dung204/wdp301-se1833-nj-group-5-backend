import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';

config({
  path: ['.env.local', '.env'],
});

@Injectable()
export class ConfigService {
  NODE_ENV = process.env['NODE_ENV'];
  APP_PORT = parseInt(process.env['APP_PORT'] ?? '3000');
  USE_HTTPS = process.env['USE_HTTPS'] === 'true';

  ACCESS_SECRET_KEY = process.env['ACCESS_SECRET_KEY'];
  REFRESH_SECRET_KEY = process.env['REFRESH_SECRET_KEY'];

  DB_HOST = process.env['DB_HOST'];
  DB_PORT = process.env['DB_PORT'];
  DB_DATABASE_NAME = process.env['DB_DATABASE_NAME'];
  MONGO_URI = `mongodb://${this.DB_HOST}:${this.DB_PORT}/${this.DB_DATABASE_NAME}`;

  REDIS = {
    host: process.env['REDIS_HOST'] ?? 'localhost',
    port: parseInt(process.env['REDIS_PORT'] ?? '6379'),
    username: process.env['REDIS_USERNAME'] ?? '',
    password: process.env['REDIS_PASSWORD'] ?? '',
  };

  MOMO = {
    partnerCode: process.env['MOMO_PARTNER_CODE'] ?? '',
    accessKey: process.env['MOMO_ACCESS_KEY'] ?? '',
    secretKey: process.env['MOMO_SECRET_KEY'] ?? '',
    ipnUrl: process.env['MOMO_IPN_URL'] ?? '',
    orderExpireTime: process.env['MOMO_EXPIRE_TIME_MINUTES'] ?? '',
    requestType: 'captureWallet',
    lang: 'en',
  };

  PAYOS = {
    clientId: process.env['PAYOS_CLIENT_ID'] ?? '',
    apiKey: process.env['PAYOS_API_KEY'] ?? '',
    checksumKey: process.env['PAYOS_CHECKSUM_KEY'] ?? '',
    apiUrl: 'https://api-merchant.payos.vn/v2/payment-requests',
  };

  MINIO = {
    endPoint: process.env['MINIO_ENDPOINT'] || 'localhost',
    port: parseInt(process.env['MINIO_PORT'] || '9000'),
    useSSL: false,
    accessKey: process.env['MINIO_ACCESS_KEY'] || 'minioadmin',
    secretKey: process.env['MINIO_SECRET_KEY'] || 'minioadmin',
    bucket: process.env['MINIO_BUCKET'] || 'mely-blog',
    region: process.env['MINIO_REGION'] || 'us-east-1',
    publicEndpoint:
      process.env['MINIO_PUBLIC_ENDPOINT'] || process.env['MINIO_ENDPOINT'] || 'localhost:9000',
    expiryInSeconds: parseInt(process.env['MINIO_EXPIRY_SECONDS'] || (10 * 60).toString()), // Default 10 minutes
    fixedExpiryInSeconds: parseInt(
      process.env['MINIO_FIXED_EXPIRY_SECONDS'] || (24 * 60 * 60).toString(),
    ), // Default 24 hours
  };
}

export const configs = new ConfigService();
