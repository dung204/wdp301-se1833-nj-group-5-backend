import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<Response>();
        const statusCode = response.statusCode;

        if (!data) return data;

        if (Array.isArray(data.data) && 'metadata' in data) {
          return {
            ...data,
            statusCode,
          };
        }

        return {
          data: data,
          statusCode,
        };
      }),
    );
  }
}
