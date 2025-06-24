import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { SchemaResponseDto } from '@/base/dtos';
import { BookingResponseDto } from '@/modules/bookings/dtos/booking.dto';

import { PaymentMethodEnum, TransactionStatus } from '../schemas/transaction.schema';

@Exclude()
export class TransactionResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'Booking information',
    type: BookingResponseDto,
  })
  @Expose()
  @Type(() => BookingResponseDto)
  booking!: BookingResponseDto;

  @ApiProperty({
    description: 'Transaction amount',
    example: 500000,
  })
  @Expose()
  amount!: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethodEnum,
    example: PaymentMethodEnum.PAYMENT_GATEWAY,
  })
  @Expose()
  paymentMethod!: PaymentMethodEnum;

  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.SUCCESS,
  })
  @Expose()
  status!: TransactionStatus;

  @ApiProperty({
    description: 'Transaction code from payment gateway',
    example: 'TXN_1720418915988',
    required: false,
  })
  @Expose()
  transactionCode?: string;

  @ApiProperty({
    description: 'Payment gateway name',
    example: 'PAYOS',
    required: false,
  })
  @Expose()
  paymentGateway?: string;

  @ApiProperty({
    description: 'Failure reason if transaction failed',
    example: 'Insufficient balance',
    required: false,
  })
  @Expose()
  failureReason?: string;
}
export class CreateTransactionDto {
  @ApiProperty({
    description: 'Booking ID for the transaction',
    example: '84d67269-7470-4ef1-bfbb-c66e7cf8c955',
  })
  @IsNotEmpty()
  @IsString()
  booking!: string;

  @ApiProperty({
    description: 'Transaction amount',
    example: 500000,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethodEnum,
    example: PaymentMethodEnum.PAYMENT_GATEWAY,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethodEnum)
  @IsString()
  paymentMethod!: PaymentMethodEnum; // string; -> nếu để string ở đây thì sẽ không có enum

  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({
    description: 'Transaction code from payment gateway',
    example: 'TXN_1720418915988',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionCode?: string;

  @ApiProperty({
    description: 'Payment gateway name',
    example: 'PAYOS',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentGateway?: string;

  @ApiProperty({
    description: 'Failure reason if transaction failed',
    example: 'Insufficient balance',
    required: false,
  })
  @IsOptional()
  @IsString()
  failureReason?: string;
}

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
