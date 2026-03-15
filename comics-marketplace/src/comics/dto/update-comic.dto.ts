import { PartialType } from '@nestjs/swagger';
import { CreateComicDto } from './create-comic.dto';

// PartialType makes all properties of CreateComicDto optional, which is ideal for update operations
// Reuse the validation rules from CreateComicDto, but allow partial updates (only the fields that need to be updated)
export class UpdateComicDto extends PartialType(CreateComicDto) {}
