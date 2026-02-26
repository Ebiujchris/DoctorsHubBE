import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class CreateNotificationDto {
  @IsOptional()
  @IsUUID()
  userId?: string; // direct recipient

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole; // broadcast to all users with this role

  @IsString()
  title: string;

  @IsString()
  message: string;
}
