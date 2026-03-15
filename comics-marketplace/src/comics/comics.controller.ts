import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComicsService } from './comics.service';
import { CreateComicDto } from './dto/create-comic.dto';
import { UpdateComicDto } from './dto/update-comic.dto';
import { FilterComicsDto } from './dto/filter-comics.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles, Role } from '../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';


// Base path: /comics
// @ApiTags group the endpoints in Swagger UI
@ApiTags('Comics')
@Controller('comics')
export class ComicsController {
  // The constructor injects the ComicsService, which contains the business logic for comics
  constructor(private readonly comicsService: ComicsService) {}

  // POST /comics - Create a new comic, requires authentication (Seller)
  @Post()
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new comic' })
  create(@Body() createComicDto: CreateComicDto, @CurrentUser() user: User) {
    return this.comicsService.create(createComicDto, user);
  }

  // GET /comics - Get all comics with pagination and filtering
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all comics with pagination and filtering' })
  findAll(@Query() query: FilterComicsDto) {
    return this.comicsService.findAll(query);
  }

  // GET /comics/:id - Get a single comic by ID
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single comic by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comicsService.findOne(id);
  }

  // PUT /comics/:id - Update a comic by ID, requires authentication (Seller)
  @Put(':id')
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comic by ID' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComicDto: UpdateComicDto,
    @CurrentUser() user: User,
  ) {
    return this.comicsService.update(id, updateComicDto, user);
  }

  // DELETE /comics/:id - Delete a comic by ID, requires authentication (Seller)
  @Delete(':id')
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comic by ID' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.comicsService.remove(id, user);
  }
}
