import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayUWebhookDto {
  @ApiProperty({
    example: 'ORDER-1773701153563-RZ5B6D',
    description: 'Order reference code sent to PayU during checkout',
  })
  @IsString()
  reference_sale: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Unique transaction ID from PayU',
  })
  @IsString()
  transaction_id: string;

  @ApiProperty({
    example: '180000.0',
    description: 'Transaction amount',
  })
  @IsString()
  value: string;

  @ApiProperty({
    example: 'COP',
    description: 'Currency code',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    example: '4',
    description: '4 = APPROVED, other values = DECLINED/FAILED',
  })
  @IsString()
  state_pol: string;

  @ApiProperty({
    example: 'APPROVED',
    description: 'Response code from PayU',
  })
  @IsString()
  @IsOptional()
  response_code_pol?: string;

  @ApiProperty({
    example: 'VISA',
    description: 'Payment method used',
  })
  @IsString()
  @IsOptional()
  payment_method_name?: string;

  @ApiProperty({
    example: 'b683af4b590021eaf45d86183b98988e',
    description: 'MD5 signature from PayU (optional for testing - will be calculated if not provided)',
  })
  @IsString()
  @IsOptional()
  sign?: string;
}

