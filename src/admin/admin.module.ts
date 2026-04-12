import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin } from './admin.entity';
import { SystemSettings } from './system-settings.entity';
import { UsersModule } from '../users/users.module';
import { BookingsModule } from '../bookings/bookings.module';
import { TestimonialsModule } from '../testimonials/testimonials.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, SystemSettings]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expirationStr = configService.get<string>('JWT_EXPIRATION') || '3600';
        const expiresInSeconds = parseInt(expirationStr, 10);
        
        console.log('🔐 AdminModule JWT setup - Using same config as AuthModule');
        
        return {
          secret: secret || 'default_secret_key_change_this',
          signOptions: {
            expiresIn: expiresInSeconds,
          },
        };
      },
    }),
    UsersModule,
    BookingsModule,
    TestimonialsModule,
    ReviewsModule,
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}