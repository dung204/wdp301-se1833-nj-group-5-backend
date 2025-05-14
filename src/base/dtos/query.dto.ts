import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

import { OrderParams } from '../decorators';

export class QueryDto {
  @ApiProperty({
    description: 'The current page number',
    default: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    description: 'The number of items in a page',
    default: 10,
    required: false,
  })
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @OrderParams(['createTimestamp'])
  order: string[] = [];
}
