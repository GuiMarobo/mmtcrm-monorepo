import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
  });

  const config = new DocumentBuilder()
    .setTitle('MMT Urbana CRM API')
    .setDescription('API do sistema CRM da MMT Urbana - Revenda Apple')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Servidor: ${await app.getUrl()}`);
  console.log(`Swagger: ${await app.getUrl()}/docs`);
}

bootstrap();
