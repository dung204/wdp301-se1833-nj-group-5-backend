import { ApiProperty } from '@nestjs/swagger';

export class MomoNotifyDto {
  @ApiProperty({
    example: 'MOMO',
  })
  partnerCode!: string;

  @ApiProperty({
    example: 'BM_1720418915988',
  })
  orderId!: string;

  @ApiProperty({
    example: 'BM_1720418915988',
  })
  requestId!: string;

  @ApiProperty({
    example: 100000,
  })
  amount!: number;

  @ApiProperty({
    example: 'Test transaction',
  })
  orderInfo!: string;

  @ApiProperty({
    example: 'momo_wallet',
  })
  orderType!: string;

  @ApiProperty({
    example: 1720418968403,
  })
  transId!: number;

  @ApiProperty({
    example: 0,
  })
  resultCode!: number;

  @ApiProperty({
    example: 'Successful.',
  })
  message!: string;

  @ApiProperty({
    example: '',
  })
  payType!: string;

  @ApiProperty({
    example: 1720418968403,
  })
  responseTime!: number;

  @ApiProperty({
    example: '',
  })
  extraData!: string;

  @ApiProperty({
    example: '294f7cea0e0e7e92a3315b81af6c9de0aff2cc96854fe48ad8f24f7787f18b83',
  })
  signature!: string;
}
