import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleOAuthStrategy } from './google-oauth.strategy';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        console.log('🔐 AuthModule JWT setup - Secret length:', secret?.length || 'UNDEFINED');
        console.log('🔐 Secret value from env:', secret ? secret.substring(0, 30) + '...' : 'NOT FOUND');
        
        if (!secret) {
          console.error('❌ CRITICAL: JWT_SECRET is not defined in environment variables!');
          console.error('❌ Check your .env file and ensure JWT_SECRET is set');
        }

        const expirationStr = configService.get<string>('JWT_EXPIRATION') || '3600';
        const expiresInSeconds = parseInt(expirationStr, 10);
        
        console.log('🔐 JWT Expiration config:', { 
          rawValue: expirationStr, 
          parsedSeconds: expiresInSeconds,
          humanReadable: `${expiresInSeconds / 3600} hours`
        });

        return {
          secret: secret || 'default_secret_key_change_this', // Fallback for debugging
          signOptions: {
            expiresIn: expiresInSeconds, // Must be number (seconds)
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleOAuthStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
