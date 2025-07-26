import { HttpService } from '@nestjs/axios';
import { HttpException, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AxiosError } from 'axios';
import * as fs from 'fs';

import { configSwagger, configs } from '@/base/configs';
import { StripUndefinedPipe } from '@/base/pipes';

import { AppModule } from './app.module';

declare const module: any;

async function bootstrap() {
  const logger = new Logger(bootstrap.name);
  const app = await NestFactory.create(AppModule, {
    ...(process.env['USE_HTTPS'] === 'true' && {
      httpsOptions: {
        key: fs.readFileSync('./cert/key.pem'),
        cert: fs.readFileSync('./cert/cert.pem'),
      },
    }),
  });
  const httpService = new HttpService();

  // Webpack HMR
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  // URL prefix: /api/v1
  app.setGlobalPrefix('/api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1'],
  });

  configSwagger(app);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
    new StripUndefinedPipe(),
  );

  httpService.axiosRef.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const response = error.response;
      throw new HttpException(response!.data as Record<string, unknown>, response!.status);
    },
  );

  await app.listen(configs.APP_PORT, () => {
    logger.log(`Current environment: ${configs.NODE_ENV}`);
    logger.log(`Server is running on port ${configs.APP_PORT}`);
    const protocol = configs.USE_HTTPS ? 'https' : 'http';
    logger.log(`API: ${protocol}://localhost:${configs.APP_PORT}/api/v1`);
    logger.log(`Swagger Docs: ${protocol}://localhost:${configs.APP_PORT}/api/v1/docs`);
  });
}
void bootstrap();
