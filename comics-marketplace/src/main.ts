import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // en production, disable NestJS logs and use your own
    bufferLogs: true,
  });

  // ── Security ────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Performance ──────────────────────────────
  app.use(compression()); // gzip in responses

  // ── API Prefix and Versioning ───────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI }); // /api/v1/...

  // ── Swagger (only in non-production) ───────────────
  // must be after global prefix to show correct routes
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Comics Marketplace API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  // ── Global Validation ──────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // delete properties that do not have any decorators in the dto
      forbidNonWhitelisted: true, // throw an error if non-whitelisted properties are present in the request
      transform: true, // convert payloads to be objects typed according to their dto classes
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Exception Filters ─────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Global Interceptors ─────────────────────────
  // order matters: execute from first to last
  app.useGlobalInterceptors(
    new TimeoutInterceptor(),
    new LoggingInterceptor(),
    new ResponseTransformInterceptor(),
  );

  // ── Graceful Shutdown ─────────────────────────────
  app.enableShutdownHooks();

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
