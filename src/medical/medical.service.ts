import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultationNote } from './consultation-note.entity';
import { Prescription } from './prescription.entity';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/entities/user.entity';
import { CreateConsultationNoteDto, UpdateConsultationNoteDto, CreatePrescriptionDto } from './dto/medical.dto';

@Injectable()
export class MedicalService {
  constructor(
    @InjectRepository(ConsultationNote) private noteRepo: Repository<ConsultationNote>,
    @InjectRepository(Prescription)     private rxRepo: Repository<Prescription>,
    @InjectRepository(Booking)          private bookingRepo: Repository<Booking>,
  ) {}

  // ── Consultation Notes ────────────────────────────────────────────────────────
  async createNote(provider: User, dto: CreateConsultationNoteDto): Promise<ConsultationNote> {
    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId }, relations: ['patient', 'provider'] });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.provider.id !== provider.id) throw new ForbiddenException();

    const note = this.noteRepo.create({
      provider,
      patient: booking.patient,
      booking,
      diagnosis: dto.diagnosis,
      notes: dto.notes,
      recommendation: dto.recommendation,
    });
    return this.noteRepo.save(note);
  }

  async updateNote(provider: User, id: string, dto: UpdateConsultationNoteDto): Promise<ConsultationNote> {
    const note = await this.noteRepo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.provider.id !== provider.id) throw new ForbiddenException();
    Object.assign(note, dto);
    return this.noteRepo.save(note);
  }

  async getNotesForProvider(provider: User): Promise<ConsultationNote[]> {
    return this.noteRepo.find({ where: { provider: { id: provider.id } }, order: { createdAt: 'DESC' } });
  }

  async getNotesForPatient(patient: User): Promise<ConsultationNote[]> {
    return this.noteRepo.find({ where: { patient: { id: patient.id } }, order: { createdAt: 'DESC' } });
  }

  async getNoteByBooking(bookingId: string): Promise<ConsultationNote | null> {
    return this.noteRepo.findOne({ where: { booking: { id: bookingId } } });
  }

  // ── Prescriptions ─────────────────────────────────────────────────────────────
  async createPrescription(provider: User, dto: CreatePrescriptionDto): Promise<Prescription> {
    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId }, relations: ['patient', 'provider'] });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.provider.id !== provider.id) throw new ForbiddenException();

    const rx = this.rxRepo.create({
      provider,
      patient: booking.patient,
      booking,
      medications: dto.medications,
      instructions: dto.instructions,
      refillDate: dto.refillDate,
    });
    return this.rxRepo.save(rx);
  }

  async getPrescriptionsForProvider(provider: User): Promise<Prescription[]> {
    return this.rxRepo.find({ where: { provider: { id: provider.id } }, order: { createdAt: 'DESC' } });
  }

  async getPrescriptionsForPatient(patient: User): Promise<Prescription[]> {
    return this.rxRepo.find({ where: { patient: { id: patient.id } }, order: { createdAt: 'DESC' } });
  }

  async getPrescriptionById(id: string, userId: string): Promise<Prescription> {
    const rx = await this.rxRepo.findOne({ where: { id } });
    if (!rx) throw new NotFoundException('Prescription not found');
    if (rx.patient.id !== userId && rx.provider.id !== userId) throw new ForbiddenException();
    return rx;
  }
}
