import { ApiProperty } from '@nestjs/swagger';

import { SwaggerExamples } from '../constants';

export class ImageDto {
  @ApiProperty({
    description: 'The file name of the image',
    example: SwaggerExamples.FILENAME,
  })
  fileName!: string;

  @ApiProperty({
    description: 'The file name of the image',
    example: SwaggerExamples.URL,
  })
  url!: string;
}
