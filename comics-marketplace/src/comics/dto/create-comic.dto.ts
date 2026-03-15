import {
  IsString,
  IsNumber,
  IsPositive,
  IsUrl,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateComicDto {
  @ApiProperty({ example: 'Watchmen', description: 'Título del cómic' })
  @IsString({ message: 'El título debe ser texto' })
  @MinLength(2, { message: 'El título debe tener al menos 2 caracteres' })
  @MaxLength(255)
  // Transform cleans up whitespace from the title
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 45000, description: 'Precio en COP' })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsPositive({ message: 'El precio debe ser positivo' })
  @Min(1000, { message: 'El precio mínimo es $1.000 COP' })
  @Max(10000000, { message: 'El precio máximo es $10.000.000 COP' })
  // Type assures that the price is treated as a number, even if sent as a string in the request
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({}, { message: 'La URL de portada no es válida' })
  coverImageUrl?: string;

  @ApiPropertyOptional({
    enum: ['Superhéroes', 'Manga', 'Fantasía', 'Terror', 'Comedia'],
  })
  @IsOptional()
  @IsIn(['Superhéroes', 'Manga', 'Fantasía', 'Terror', 'Comedia'], {
    message: 'Género no válido',
  })
  genre?: string;
}
