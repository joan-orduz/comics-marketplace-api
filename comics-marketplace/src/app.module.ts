import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ComicsModule } from './comics/comics.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    // ConfigModule: enviroment variables, configured ONLY ONE TIME
    ConfigModule.forRoot({ isGlobal: true }),
    // TypeOrmModule: connection with the database, configured ONLY ONE TIME
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
        ssl: false,
      }),
    }),
    // CacheModule: caching, configured ONLY ONE TIME
    CacheModule.registerAsync({
      isGlobal: true, // available in all modules without needing to import CacheModule again
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: redisStore,
        host: config.get('REDIS_HOST', 'localhost'),
        port: config.get<number>('REDIS_PORT', 6379),
        password: config.get('REDIS_PASSWORD'),
        ttl: 300, // default time to live (seconds) for cached items
        tls: config.get('NODE_ENV') === 'production' ? {} : undefined,
      }),
    }),
    // ThrottlerModule: rate limiting, configured ONLY ONE TIME
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // Time to live (seconds)
        limit: 10, // Max requests per ttl
      },
    ]),
    // Business modules
    ComicsModule,
    UsersModule,
    AuthModule,
    // TO DO: OrdersModule,
    // TO DO: PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    // JwtAuthGuard global: every request requires a valid JWT,
    // except the ones with @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // RolesGuard global: verifies roles when @Roles() is used
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AppService,
  ],
})
export class AppModule {}
