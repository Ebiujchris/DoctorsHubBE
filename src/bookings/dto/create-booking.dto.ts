import { IsUUID, IsEnum, IsDateString, IsOptional, IsString } from 'class-validator';
import { ConsultationType } from '../booking.entity';

export class CreateBookingDto {
  @IsUUID()
  providerId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsEnum(ConsultationType)
  consultationType: ConsultationType;

  @IsOptional()
  @IsString()
  notes?: string;
}
