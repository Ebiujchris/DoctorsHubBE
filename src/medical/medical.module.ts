import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationNote } from './consultation-note.entity';
import { Prescription } from './prescription.entity';
import { Booking } from '../bookings/booking.entity';
import { MedicalService } from './medical.service';
import { MedicalController } from './medical.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConsultationNote, Prescription, Booking])],
  providers: [MedicalService],
  controllers: [MedicalController],
})
export class MedicalModule {}
