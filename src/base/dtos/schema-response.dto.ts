import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, plainToInstance } from 'class-transformer';

import { SwaggerExamples } from '../constants';

export class SchemaResponseDto {
  @ApiProperty({
    description: 'The UUID of the item',
    example: SwaggerExamples.UUID,
  })
  @Transform(({ obj }) => obj._id)
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'The timestamp indicating when the item is created',
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  createTimestamp!: Date;

  @ApiProperty({
    description: 'The timestamp indicating when the item is last updated',
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  updateTimestamp!: Date;

  public static mapToDto(raw: unknown) {
    return plainToInstance(this, raw);
  }
}
