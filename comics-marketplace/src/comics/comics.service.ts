import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, Filter } from 'typeorm';
import { CreateComicDto } from './dto/create-comic.dto';
import { UpdateComicDto } from './dto/update-comic.dto';
import { FilterComicsDto } from './dto/filter-comics.dto';
import { Comic } from './entities/comic.entity';
import { User } from '../users/entities/user.entity';
import { PaginatedResult } from '../common/pagination/paginated-result.interface';
import { Role } from '../auth/decorators/roles.decorator';

// Injectable tells NestJS that this class can be injected as a dependency
@Injectable()
export class ComicsService {
  constructor(
    // InjectRepository is used to inject the TypeORM repository for the Comic entity
    @InjectRepository(Comic)
    private comicsRepository: Repository<Comic>,
  ) {}

  async create(dto: CreateComicDto, seller: User): Promise<Comic> {
    // Only Seller and Admin can create comics
    if (seller.role !== Role.SELLER && seller.role !== Role.ADMIN) {
      throw new ForbiddenException('Only sellers can create comics');
    }
    // validate with the business logic:
    if (dto.price <= 0) {
      throw new BadRequestException('Price must be greater than zero');
    }
    // create the comic entity with the authenticated user as the seller
    const comic = this.comicsRepository.create({
      ...dto,
      seller,
      sellerId: seller.id,
    });
    return this.comicsRepository.save(comic);
  }

  async findAll(query: FilterComicsDto): Promise<PaginatedResult<Comic>> {
    const { page = 1, limit = 20, genre, search } = query;

    // build the where condition based on the filters
    const where: FindOptionsWhere<Comic> = { active: true };
    if (genre) where.genre = genre;
    if (search) where.title = ILike(`%${search}%`); // search by title with case-insensitive matching
    const [items, total] = await this.comicsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit, // offset for pagination
      take: limit, // maximum number of items to return
      relations: ['seller'], // include seller information in the response
    });
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Comic> {
    const comic = await this.comicsRepository.findOne({
      where: { id, active: true },
      relations: ['seller'],
    });
    if (!comic) throw new NotFoundException(`Comic with ID ${id} not found`);
    return comic;
  }

  async update(id: string, updateComicDto: UpdateComicDto, user: User): Promise<Comic> {
    const comic = await this.findOne(id);

    // Only the owner (seller) or admin can update
    const isOwner = comic.sellerId === user.id;
    const isAdmin = user.role === Role.ADMIN;
    
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not the owner of this comic');
    }

    Object.assign(comic, updateComicDto); // update the comic entity with the new values

    return this.comicsRepository.save(comic); // save the updated comic to the databaseq
  }

  async remove(id: string, user: User): Promise<void> {
    const comic = await this.findOne(id);

    // Only the owner (seller) or admin can delete
    const isOwner = comic.sellerId === user.id;
    const isAdmin = user.role === Role.ADMIN;
    
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not the owner of this comic');
    }

    await this.comicsRepository.update(id, { active: false }); // soft delete by setting active to false
  }
}
