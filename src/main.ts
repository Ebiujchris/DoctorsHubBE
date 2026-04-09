import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend (local dev + production URLs)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://doctors-hub-be-git-main-ebiu-julius-projects.vercel.app',
    process.env.FRONTEND_URL, // Add from env for flexibility
    /\.railway\.app$/, // Allow all Railway frontend URLs
    /\.onrender\.com$/, // Allow all Render URLs (if switching back)
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Bind to all interfaces for Railway
  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch(err => {
  console.error('❌ Error starting application:', err);
  process.exit(1);
});
