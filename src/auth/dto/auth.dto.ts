import { IsEmail, IsString, IsPhoneNumber, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsPhoneNumber()
  phone: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  specialty?: string; // Optional for healthcare providers
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class GoogleLoginDto {
  @IsString()
  idToken: string; // Google OAuth ID token from frontend
}

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  specialty?: string;
  profilePicture?: string;
  bio?: string;
  rating?: number;
  reviews?: number;
  experience?: string;
  responseTime?: string;
  isVerified: boolean;
  isActive: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthResponseDto {
  user: UserResponseDto;
  access_token: string;
  token_type: string;
}
