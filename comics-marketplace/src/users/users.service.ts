import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, Filter } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Role } from '../auth/decorators/roles.decorator';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(dto);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.usersRepository.save({
    ...dto,
    password: hashedPassword,
  });
  }

  async findAll(): Promise<User[]> {
    // Note: findAll is limited to Admin via @Roles(Role.ADMIN) in controller
    return this.usersRepository.find();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
    .createQueryBuilder('user')
    .addSelect('user.password')
    .where('user.email = :email', { email })
    .getOne();
  }

  async findOne(id: string, requestingUser?: User): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // If no requesting user, return the public user (for admin endpoints)
    if (!requestingUser) return user;
    
    // Users can only view their own profile or admin can view any
    const canView = requestingUser.id === id || requestingUser.role === Role.ADMIN;
    if (!canView) {
      throw new ForbiddenException('You can only view your own profile');
    }
    
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, requestingUser: User) {
    const user = await this.findOne(id);

    // Users can only update their own profile or admin can update any
    const canUpdate = requestingUser.id === id || requestingUser.role === Role.ADMIN;
    if (!canUpdate) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async setRefreshToken(userId: string, tokenHash: string | null) {
    return this.usersRepository.update(userId, { refreshTokenHash: tokenHash });
  }

  async remove(id: string, requestingUser: User) {
    const user = await this.findOne(id);
    
    // Only admin can delete users
    if (requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    return this.usersRepository.remove(user);
  }
}
