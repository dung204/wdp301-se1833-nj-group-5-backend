import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as Minio from 'minio';

import { configs } from '@/base/configs';

import { MINIO_CLIENT } from './minio.provider';

@Injectable()
export class MinioStorageService {
  private readonly logger = new Logger(MinioStorageService.name);

  constructor(@Inject(MINIO_CLIENT) private readonly minioClient: Minio.Client) {
    this.initBucket().catch((err) => {
      this.logger.error(`Error initializing MinIO bucket: ${err.message}`);
    });
  }

  private async initBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(configs.MINIO.bucket);
      if (!bucketExists) {
        await this.minioClient.makeBucket(configs.MINIO.bucket, configs.MINIO.region);

        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject', 's3:GetBucketLocation'],
              Resource: [
                `arn:aws:s3:::${configs.MINIO.bucket}`,
                `arn:aws:s3:::${configs.MINIO.bucket}/*`,
              ],
            },
          ],
        };

        await this.minioClient.setBucketPolicy(configs.MINIO.bucket, JSON.stringify(policy));
        this.logger.log(`Bucket '${configs.MINIO.bucket}' created and set to public`);
      } else {
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject', 's3:GetBucketLocation'],
              Resource: [
                `arn:aws:s3:::${configs.MINIO.bucket}`,
                `arn:aws:s3:::${configs.MINIO.bucket}/*`,
              ],
            },
          ],
        };

        await this.minioClient.setBucketPolicy(configs.MINIO.bucket, JSON.stringify(policy));
        this.logger.log(`Updated bucket policy for '${configs.MINIO.bucket}'`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to initialize bucket: ${error.message}`);
    }
  }

  /**
   * Upload file to MinIO
   * @param file
   * @param fixedTime
   */
  async uploadFile(
    file: Express.Multer.File,
    fixedTime?: boolean,
    folder?: string,
  ): Promise<{ url: string | null; fileName: string }> {
    const timestamp = new Date().toISOString();
    const uniqueId = randomUUID();

    const originalName = this.sanitizeFileName(file.originalname);

    const fileName = folder
      ? `${folder}/${timestamp}-${uniqueId}-${originalName}`
      : `${timestamp}-${uniqueId}-${originalName}`;

    await this.minioClient.putObject(configs.MINIO.bucket, fileName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const url = await this.getFileUrl(fileName, fixedTime);
    return { url, fileName };
  }

  async uploadFromBuffer(
    buffer: Buffer,
    fileName: string,
    size: number,
    mimeType: string,
    fixedTime?: boolean,
    folder?: string,
  ) {
    const timestamp = new Date().toISOString();
    const uniqueId = randomUUID();

    const originalName = this.sanitizeFileName(fileName);

    const savedFileName = folder
      ? `${folder}/${timestamp}-${uniqueId}-${originalName}`
      : `${timestamp}-${uniqueId}-${originalName}`;

    await this.minioClient.putObject(configs.MINIO.bucket, savedFileName, buffer, size, {
      'Content-Type': mimeType,
    });

    const url = await this.getFileUrl(savedFileName, fixedTime);
    return { url, fileName: savedFileName };
  }

  /**
   * Sanitize file name to remove spaces, accents and special characters
   * @param fileName Original file name
   * @returns Sanitized file name
   */
  private sanitizeFileName(fileName: string): string {
    const withoutDiacritics = fileName.normalize('NFD').replace(/\p{Diacritic}/gu, '');

    const withoutSpaces = withoutDiacritics.replace(/\s+/g, '_');

    const sanitized = withoutSpaces.replace(/[^a-zA-Z0-9_\-.]/g, '');

    return sanitized;
  }

  /**
   * Get file URL
   * @param fileName
   * @param fixedTime
   */
  async getFileUrl(fileName: string, fixedTime?: boolean): Promise<string | null> {
    if (!fileName) return null;

    const expiryInSeconds = fixedTime
      ? configs.MINIO.fixedExpiryInSeconds
      : configs.MINIO.expiryInSeconds;

    try {
      const url = await this.minioClient.presignedGetObject(
        configs.MINIO.bucket,
        fileName,
        expiryInSeconds,
      );

      return url.replace(
        `http://${configs.MINIO.endPoint}:${configs.MINIO.port}/${configs.MINIO.bucket}`,
        configs.MINIO.publicEndpoint,
      );
    } catch (error: any) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`);
      return `${configs.MINIO.useSSL ? 'https' : 'http'}://${configs.MINIO.publicEndpoint}/${configs.MINIO.bucket}/${fileName}`;
    }
  }

  /**
   * Delete file from MinIO
   * @param fileName
   */
  async deleteFile(fileName: string): Promise<void> {
    if (!fileName) return;

    await this.minioClient.removeObject(configs.MINIO.bucket, fileName);
    this.logger.log(`File ${fileName} deleted successfully`);
  }

  /**
   * Check MinIO connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.minioClient.listBuckets();
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to connect to MinIO: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all files in bucket
   */
  async listFiles(): Promise<string[]> {
    const fileNames: string[] = [];

    try {
      const stream = this.minioClient.listObjects(configs.MINIO.bucket, '', true);

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) fileNames.push(obj.name);
        });

        stream.on('error', (err) => {
          reject(err);
        });

        stream.on('end', () => {
          resolve(fileNames);
        });
      });
    } catch (error: any) {
      this.logger.error(`Failed to list files: ${error.message}`);
      throw error;
    }
  }
}
