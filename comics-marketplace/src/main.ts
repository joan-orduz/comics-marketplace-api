import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ValidationPipe applies validation rules defined in DTOs globally to all incoming requests
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // delete properties that do not have any decorators in the DTO
    forbidNonWhitelisted: true, // throw an error if non-whitelisted properties are present in the request
    transform: true,       // convert payloads to be objects typed according to their DTO classes
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Comics Marketplace API')
    .setDescription('API para marketplace de cómics')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);

  // helmet is a collection of middleware functions that set various HTTP headers to help protect the app from well-known web vulnerabilities.
  // includes: X-Content-Type-Options, X-Frame-Options,
  //          Content-Security-Policy, HSTS, etc.

  app.use(helmet());

}
bootstrap();
