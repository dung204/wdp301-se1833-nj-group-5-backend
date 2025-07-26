import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { concatMap } from 'rxjs';

import { MinioStorageService } from '@/modules/minio-storage/minio-storage.service';

import { ImageDto } from '../dtos';

/**
 * Interceptor that transforms image file names in the response data into objects containing
 * the file name and a publicly accessible URL. It recursively traverses arrays and objects,
 * replacing any `images` property (an array of strings) with an array of `ImageDto` objects.
 *
 * @remarks
 * This interceptor is intended to be used in NestJS controllers to automatically convert
 * image file names to URLs using the provided `MinioStorageService`.
 *
 * @example
 * // Before transformation:
 * {
 *   images: ['img1.jpg', 'img2.jpg']
 * }
 * // After transformation:
 * {
 *   images: [
 *     { fileName: 'img1.jpg', url: 'https://...' },
 *     { fileName: 'img2.jpg', url: 'https://...' }
 *   ]
 * }
 */
@Injectable()
export class ImageTransformInterceptor implements NestInterceptor {
  constructor(private readonly minioStorageService: MinioStorageService) {}

  intercept(_: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(concatMap((data) => this.transformImages(data)));
  }

  private async transformImages(obj: any): Promise<any> {
    if (Array.isArray(obj)) {
      const result = [];

      for (const elem of obj) {
        result.push(await this.transformImages(elem));
      }

      return result;
    } else if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(obj as Record<string, unknown>)) {
        if (
          key === 'images' &&
          Array.isArray(obj[key]) &&
          obj[key].every((elem) => typeof elem === 'string')
        ) {
          const imageDtos: ImageDto[] = [];

          for (const image of obj[key]) {
            const imageUrl = await this.minioStorageService.getFileUrl(image);

            if (imageUrl) {
              imageDtos.push({
                fileName: image,
                url: imageUrl,
              });
            }
          }

          result[key] = imageDtos;
        } else {
          result[key] = await this.transformImages(obj[key]);
        }
      }
      return result;
    }
    return obj;
  }
}
