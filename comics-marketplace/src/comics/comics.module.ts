import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comic } from './entities/comic.entity';
import { ComicsService } from './comics.service';
import { ComicsController } from './comics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comic])],
  controllers: [ComicsController],
  providers: [ComicsService],
  exports: [ComicsService],
})
export class ComicsModule {}
