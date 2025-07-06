import { Provider } from '@nestjs/common';
import * as Minio from 'minio';

import { configs } from '@/base/configs';

export const MINIO_CLIENT = 'MINIO_CLIENT';

export const MinioProvider: Provider = {
  provide: MINIO_CLIENT,
  useFactory: () => {
    return new Minio.Client({
      endPoint: configs.MINIO.endPoint,
      port: configs.MINIO.port,
      useSSL: configs.MINIO.useSSL,
      accessKey: configs.MINIO.accessKey,
      secretKey: configs.MINIO.secretKey,
      region: configs.MINIO.region,
    });
  },
};
