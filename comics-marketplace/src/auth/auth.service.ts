import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthTokensDto } from './dto/auth-tokens.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // validateUser checks if the provided email and password are correct
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  // login generates a JWT token for the authenticated user
  async login(user: User): Promise<AuthTokensDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    // save the refresh token in the database for later validation
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.userService.setRefreshToken(user.id, refreshHash);
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async validateAndLogin(email: string, password: string): Promise<AuthTokensDto> {
    const user = await this.validateUser(email, password);
    if (!user) throw new ForbiddenException('Invalid credentials');
    return this.login(user);
  }

  // register a new user
  async register(dto: CreateUserDto): Promise<AuthTokensDto> {
    // verify that the email is not already in use
    const exists = await this.userService.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already in use');
    const user = await this.userService.create(dto);

    if (user) {
      return this.login(user); // auto-login after registration
    } else {
      throw new ConflictException('Failed to create user');
    }
  }
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userService.findOne(userId);
    if (!user?.refreshTokenHash) throw new ForbiddenException('Access denied');

    // verify that the provided refresh token matches the hash stored in the database
    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) throw new ForbiddenException('Invalid refresh token');

    // rotation: the refresh token used is invalidated and a new one is issued
    return this.login(user);
  }

  async logout(userId: string) {
    // invalidate the refresh token by setting it to null
    return this.userService.setRefreshToken(userId, null);
  }
}
