/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

import { IS_ADMIN_KEY } from '@/modules/auth/decorators/admin.decorator';
import { IS_PUBLIC_KEY } from '@/modules/auth/decorators/public.decorator';
import { Role } from '@/modules/auth/enums/role.enum';

const PATH_KEY = 'path';
const SWAGGER_API_RESPONSE_KEY = 'swagger/apiResponse';
const SWAGGER_API_OPERATION_KEY = 'swagger/apiOperation';
const SWAGGER_API_CONSUMES_KEY = 'swagger/apiConsumes';
const API_CONSUMES_MIME_TYPES = ['application/x-www-form-urlencoded', 'application/json'];

export function configSwagger(app: INestApplication) {
  const makeDocument = () => {
    const discoveryService = app.get(DiscoveryService);
    const controllers = discoveryService.getControllers();
    const controllerPaths: string[] = [];

    for (const controller of controllers) {
      if (controller.metatype) {
        const isControllerPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.metatype);
        const isControllerAdmin = Reflect.getMetadata(IS_ADMIN_KEY, controller.metatype);
        const controllerPath = Reflect.getMetadata(PATH_KEY, controller.metatype);
        const controllerResponses = Reflect.getMetadata(
          SWAGGER_API_RESPONSE_KEY,
          controller.metatype,
        );
        const controllerApiConsumes: string[] = Reflect.getMetadata(
          SWAGGER_API_CONSUMES_KEY,
          controller.metatype,
        );

        // Applying class decorators
        controllerPaths.push(controllerPath);
        ApiTags(controllerPath)(controller.metatype);

        // Applying method decorators
        const controllerClass = controller.metatype.prototype;
        const methods = Object.getOwnPropertyNames(controllerClass).filter(
          (method) => method !== 'constructor',
        );

        for (const method of methods) {
          const isRoutePublic = Reflect.getMetadata(IS_PUBLIC_KEY, controllerClass[method]);
          const isRouteAdmin = Reflect.getMetadata(IS_ADMIN_KEY, controllerClass[method]);
          const apiOperation = Reflect.getMetadata(
            SWAGGER_API_OPERATION_KEY,
            controllerClass[method],
          );
          const routeResponses = Reflect.getMetadata(
            SWAGGER_API_RESPONSE_KEY,
            controllerClass[method],
          );
          const routeApiConsumes: string[] = Reflect.getMetadata(
            SWAGGER_API_CONSUMES_KEY,
            controllerClass[method],
          );
          const methodDecoratorParams = [
            controllerClass,
            method,
            Object.getOwnPropertyDescriptor(controllerClass, method)!,
          ] as const;

          ApiConsumes(...(routeApiConsumes || controllerApiConsumes || API_CONSUMES_MIME_TYPES))(
            ...methodDecoratorParams,
          );
          ApiInternalServerErrorResponse({
            description: 'Internal Server Error',
            ...controllerResponses?.['500'],
            ...routeResponses?.['500'],
          })(...methodDecoratorParams);

          if (isRoutePublic || isControllerPublic) continue;

          // Require authentication for routes that are not marked as @Public()
          if (isRouteAdmin || isControllerAdmin) {
            if (apiOperation) {
              const { summary, ...apiOperationMetadata } = apiOperation;
              ApiOperation({
                summary: (summary?.trim() ?? '') + ` (for ${Role.ADMIN} only)`,
                ...apiOperationMetadata,
              })(...methodDecoratorParams);
            }
            ApiForbiddenResponse({
              description: `User is not an \`${Role.ADMIN}\``,
              ...controllerResponses?.['403'],
              ...routeResponses?.['403'],
            })(...methodDecoratorParams);
          }

          ApiBearerAuth('JWT')(...methodDecoratorParams);
          ApiUnauthorizedResponse({
            description: 'User is not logged in',
            ...controllerResponses?.['401'],
            ...routeResponses?.['401'],
          })(...methodDecoratorParams);
        }
      }
    }

    const config = new DocumentBuilder()
      .setTitle('Base NestJS project API Documentation')
      .setLicense('The Unlicense', 'https://unlicense.org/')
      .setVersion('1.0')
      .addBearerAuth(
        {
          description: 'Enter JWT authentication (access) token',
          name: 'Authorization',
          bearerFormat: 'Bearer',
          scheme: 'Bearer',
          type: 'http',
          in: 'Header',
        },
        'JWT',
      )
      .build();

    config.tags = [
      ...(config.tags ?? []),
      ...controllerPaths.map((path) => ({ name: path, description: `Operations about ${path}` })),
    ];

    return SwaggerModule.createDocument(app, config);
  };

  SwaggerModule.setup('/api/v1/docs', app, makeDocument);
}
