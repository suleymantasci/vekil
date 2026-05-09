import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger (opzionale, per sviluppo)
  // const swagger = await import('@nestjs/swagger').then(m => m.ApiModule.setup('docs', app, document));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Vekil Server running on http://0.0.0.0:${port}`);
}

bootstrap();