import { Module } from '@nestjs/common';

import { MinioStorageService } from './minio-storage.service';
import { MinioProvider } from './minio.provider';

@Module({
  providers: [MinioProvider, MinioStorageService],
  exports: [MinioStorageService],
})
export class MinioStorageModule {}
