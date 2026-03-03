import { IsUUID, IsEnum, IsDateString } from 'class-validator';
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
}
