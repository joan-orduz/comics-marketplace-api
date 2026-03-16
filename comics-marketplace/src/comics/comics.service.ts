import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, Filter } from 'typeorm';
import { CreateComicDto } from './dto/create-comic.dto';
import { UpdateComicDto } from './dto/update-comic.dto';
import { FilterComicsDto } from './dto/filter-comics.dto';
import { Comic } from './entities/comic.entity';
import type { User } from '../users/entities/user.entity';
import type { PaginatedResult } from '../common/pagination/paginated-result.interface';
import { Role } from '../auth/decorators/roles.decorator';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

// injectable tells NestJS that this class can be injected as a dependency
@Injectable()
export class ComicsService {
  private readonly logger = new Logger(ComicsService.name);
  private readonly CACHE_KEY_PREFIX = 'comics:list';
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor(
    // InjectRepository is used to inject the TypeORM repository for the Comic entity
    @InjectRepository(Comic)
    private comicsRepository: Repository<Comic>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    const result = await this.comicsRepository.save(comic);

    // invalidate all comics list cache when a new comic is created
    await this.invalidateComicsCache();
    this.logger.log('comic created. cache invalidated.');

    return result;
  }

  async findAll(query: FilterComicsDto): Promise<PaginatedResult<Comic>> {
    const { page = 1, limit = 20, genre, search } = query;

    // generate unique cache key based on query parameters
    const cacheKey = `${this.CACHE_KEY_PREFIX}:page=${page}:limit=${limit}:genre=${genre || 'all'}:search=${search || 'all'}`;

    // try to get from cache
    const cached = await this.cacheManager.get<PaginatedResult<Comic>>(cacheKey);
    if (cached) {
      this.logger.debug(`cache hit for key: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`cache miss for key: ${cacheKey}. querying database...`);

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

    const result = { items, total, page, limit, pages: Math.ceil(total / limit) };

    // store in cache with TTL (must convert seconds to milliseconds)
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL * 1000);
    this.logger.debug(`cached result for key: ${cacheKey}`);

    return result;
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
    const result = await this.comicsRepository.save(comic); // save the updated comic to the database

    // invalidate all comics list cache when a comic is updated
    await this.invalidateComicsCache();
    this.logger.log(`comic ${id} updated. cache invalidated.`);

    return result;
  }

  async remove(id: string, user: User): Promise<void> {
    const comic = await this.findOne(id);

    // only the owner (seller) or admin can delete
    const isOwner = comic.sellerId === user.id;
    const isAdmin = user.role === Role.ADMIN;
    
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not the owner of this comic');
    }

    await this.comicsRepository.update(id, { active: false }); // soft delete by setting active to false

    // invalidate all comics list cache when a comic is removed
    await this.invalidateComicsCache();
    this.logger.log(`comic ${id} removed. cache invalidated.`);
  }

  /**
   * invalidate all comics list cache entries using wildcard pattern
   * called whenever data changes (create, update, delete)
   * uses redis wildcard to match all keys starting with CACHE_KEY_PREFIX
   */
  private async invalidateComicsCache(): Promise<void> {
    try {
      // get all cache keys matching the pattern 'comics:list:*'
      // wildcard pattern is more efficient than fetching all keys
      const redisStore = this.cacheManager.stores as any;
      const keys = await redisStore.keys(`${this.CACHE_KEY_PREFIX}:*`);
      
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
        this.logger.debug(`invalidated ${keys.length} cache keys matching pattern '${this.CACHE_KEY_PREFIX}:*'`);
      }
    } catch (error) {
      this.logger.error(`failed to invalidate cache: ${error.message}`);
    }
  }
}
