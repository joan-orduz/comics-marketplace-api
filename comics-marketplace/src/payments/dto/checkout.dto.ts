import { IsUUID, IsNumber, IsPositive, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutItemDto {
  @IsUUID()
  comicId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CheckoutDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}
