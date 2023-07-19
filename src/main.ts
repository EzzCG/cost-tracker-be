import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const globalPrefix = 'api';
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
  Logger.log(`🚀 Application is running on: http://localhost:3000/`);
}
bootstrap();
