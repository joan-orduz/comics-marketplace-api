import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

}
bootstrap();
