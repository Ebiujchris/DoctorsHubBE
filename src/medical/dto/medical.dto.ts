import { IsString, IsOptional, IsUUID, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConsultationNoteDto {
  @IsUUID()
  bookingId: string;

  @IsOptional() @IsString()
  diagnosis?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  recommendation?: string;
}

export class UpdateConsultationNoteDto {
  @IsOptional() @IsString()
  diagnosis?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  recommendation?: string;
}

export class MedicationDto {
  @IsString() name: string;
  @IsString() dosage: string;
  @IsString() frequency: string;
  @IsString() duration: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreatePrescriptionDto {
  @IsUUID()
  bookingId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications: MedicationDto[];

  @IsOptional() @IsString()
  instructions?: string;

  @IsOptional() @IsDateString()
  refillDate?: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() experience?: string;
  @IsOptional() @IsString() responseTime?: string;
  @IsOptional() @IsString() fees?: string;
  @IsOptional() @IsString() profilePicture?: string;
}
