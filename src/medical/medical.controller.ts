import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MedicalService } from './medical.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateConsultationNoteDto, UpdateConsultationNoteDto, CreatePrescriptionDto } from './dto/medical.dto';

@Controller()
export class MedicalController {
  constructor(private medicalService: MedicalService) {}

  // ── Consultation Notes ────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('consultation-notes')
  createNote(@Request() req, @Body() dto: CreateConsultationNoteDto) {
    return this.medicalService.createNote(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('consultation-notes/:id')
  updateNote(@Request() req, @Param('id') id: string, @Body() dto: UpdateConsultationNoteDto) {
    return this.medicalService.updateNote(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('consultation-notes')
  getMyNotes(@Request() req) {
    const u = req.user;
    if (u.role === 'patient') return this.medicalService.getNotesForPatient(u);
    return this.medicalService.getNotesForProvider(u);
  }

  @UseGuards(JwtAuthGuard)
  @Get('consultation-notes/booking/:bookingId')
  getNoteByBooking(@Param('bookingId') bookingId: string) {
    return this.medicalService.getNoteByBooking(bookingId);
  }

  // ── Prescriptions ─────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('prescriptions')
  createPrescription(@Request() req, @Body() dto: CreatePrescriptionDto) {
    return this.medicalService.createPrescription(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('prescriptions')
  getMyPrescriptions(@Request() req) {
    const u = req.user;
    if (u.role === 'patient') return this.medicalService.getPrescriptionsForPatient(u);
    return this.medicalService.getPrescriptionsForProvider(u);
  }

  @UseGuards(JwtAuthGuard)
  @Get('prescriptions/:id')
  getPrescription(@Request() req, @Param('id') id: string) {
    return this.medicalService.getPrescriptionById(id, req.user.id);
  }
}
