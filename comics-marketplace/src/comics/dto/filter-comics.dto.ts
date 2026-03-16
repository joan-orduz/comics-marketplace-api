import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilterComicsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)  // converts the page query param to a number
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)  // prevents someone from requesting 10,000 records
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search term for comic titles' })
  search?: string;  // search term for title
  
  @IsOptional()
  @IsIn(['Superheroes', 'Manga', 'Fantasy', 'Horror', 'Comedy'])
  @ApiPropertyOptional({
    enum: ['Superheroes', 'Manga', 'Fantasy', 'Horror', 'Comedy'],
    description: 'Filter comics by genre',
  })
  genre?: string;
}
