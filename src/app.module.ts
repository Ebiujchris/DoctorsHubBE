import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotificationModule } from './notifications/notification.module';
import { BookingsModule } from './bookings/bookings.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // Ensure values are loaded even if .env is missing
      ignoreEnvFile: false,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        console.log('🔐 JWT_SECRET loaded:', jwtSecret ? `${jwtSecret.length} chars` : 'UNDEFINED - CHECK .env FILE');
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          entities: ['dist/**/*.entity.js'],
          synchronize: true, // Set to false in production
          logging: false,
          ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    AuthModule,
    UsersModule,
    NotificationModule,
    BookingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
