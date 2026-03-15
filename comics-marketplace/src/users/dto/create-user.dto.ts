import {
  IsString,
  Matches,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Nombre completo del usuario',
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Correo electrónico del usuario',
  })
  @IsString({ message: 'El correo electrónico debe ser texto' })
  @MinLength(2, {
    message: 'El correo electrónico debe tener al menos 2 caracteres',
  })
  @MaxLength(255)
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña del usuario',
  })
  // Regex: minimum 8 characters, at least 1 uppercase letter, 1 number and 1 special character
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: 'Password: min 8 chars, 1 uppercase, 1 number, 1 symbol',
    }
  )
  password: string;


  @ApiPropertyOptional({
    example: 'Buyer',
    description: 'Rol del usuario (Buyer, Seller o Admin)',
  })
  @IsOptional()
  @IsIn(['Buyer', 'Seller', 'Admin'], { message: 'El rol debe ser "Buyer", "Seller" o "Admin"' })
  role?: string;

  // Comics will be created separately, so we don't include them in the CreateUserDto
}
