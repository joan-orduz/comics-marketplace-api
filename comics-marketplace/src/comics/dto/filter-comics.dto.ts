import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

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
  search?: string;  // search term for title
  
  @IsOptional()
  @IsIn(['Superhéroes', 'Manga', 'Fantasía', 'Terror', 'Comedia'])
  genre?: string;
}
