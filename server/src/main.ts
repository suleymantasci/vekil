import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS - explicit origins only
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global middleware - instantiate and bind to avoid class constructor error with Express
  const securityMiddleware = new SecurityHeadersMiddleware();
  app.use(securityMiddleware.use.bind(securityMiddleware));
  app.use(RequestContextMiddleware);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter - don't leak stack traces in production
  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  // Disable X-Powered-By header
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Vekil Server running on http://0.0.0.0:${port}`);
}

bootstrap();
