import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({
    description: 'The current page number',
    example: 1,
  })
  currentPage!: number;

  @ApiProperty({
    description: 'The number of items in a page',
    example: 10,
  })
  pageSize!: number;

  @ApiProperty({
    description: 'The total number of items in the data source',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: 'The total number of pages',
    example: 10,
  })
  totalPage!: number;

  @ApiProperty({
    description: 'A boolean indicating if there is the next page',
    example: true,
  })
  hasNextPage!: boolean;

  @ApiProperty({
    description: 'A boolean indicating if there is the previous page',
  })
  hasPreviousPage!: boolean;
}
