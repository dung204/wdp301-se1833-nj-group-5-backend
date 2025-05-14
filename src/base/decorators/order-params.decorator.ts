import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { SwaggerExamples } from '../constants';
import { IsOrderParams } from './is-order-params.decorator';

export function OrderParams(validFields: string[]) {
  return applyDecorators(
    ApiProperty({
      required: false,
      description: `The sorting for the query. The syntax is \`{field}:{order}\`. Allowed fields are: ${validFields.map((field) => `\`${field}\``).join(', ')}`,
      isArray: true,
      items: {
        type: 'string',
        default: SwaggerExamples.ORDER_VALUE,
        example: SwaggerExamples.ORDER_VALUE,
      },
    }),
    IsOptional(),
    IsString({ each: true }),
    IsOrderParams(validFields),
    Transform(({ value }) => (typeof value === 'string' ? [value] : value)),
  );
}
