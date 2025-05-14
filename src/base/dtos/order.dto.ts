import { ApiProperty } from '@nestjs/swagger';

import { SwaggerExamples } from '../constants';

export class OrderDto {
  @ApiProperty({
    description: 'The field to sort',
    example: SwaggerExamples.ORDER_FIELD,
  })
  field!: string;

  @ApiProperty({
    description: 'The order direction to sort',
    example: SwaggerExamples.ORDER_DIRECTION,
  })
  direction!: 'ASC' | 'DESC';
}
