import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';
import { Availability } from './availability.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,
    private notification: NotificationService,
  ) {}

  // provider availability management
  async createAvailability(provider: User, dto: CreateAvailabilityDto) {
    if (provider.role === UserRole.PATIENT) {
      throw new ForbiddenException('Only providers can create availability');
    }
    const avail = this.availabilityRepo.create({
      provider,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
    });
    return this.availabilityRepo.save(avail);
  }

  async listMyAvailabilities(provider: User) {
    return this.availabilityRepo.find({ where: { provider } });
  }

  async updateAvailability(provider: User, id: string, dto: UpdateAvailabilityDto) {
    const avail = await this.availabilityRepo.findOne({ where: { id } });
    if (!avail) throw new NotFoundException('Availability not found');
    if (avail.provider.id !== provider.id) {
      throw new ForbiddenException();
    }
    if (avail.isBooked) {
      throw new BadRequestException('Cannot edit a booked slot');
    }
    if (dto.startTime) avail.startTime = new Date(dto.startTime);
    if (dto.endTime) avail.endTime = new Date(dto.endTime);
    return this.availabilityRepo.save(avail);
  }

  async removeAvailability(provider: User, id: string) {
    const avail = await this.availabilityRepo.findOne({ where: { id } });
    if (!avail) throw new NotFoundException('Availability not found');
    if (avail.provider.id !== provider.id) throw new ForbiddenException();
    if (avail.isBooked) throw new BadRequestException('Cannot remove booked slot');
    await this.availabilityRepo.remove(avail);
  }

  // patient side - find available providers
  async findAvailableProviders() {
    // providers who have at least one availability that is not booked and in future and none of the availabilities is booked?
    const now = new Date();
    // we need providers who have at least one free future slot and no existing bookings
    const avail = await this.availabilityRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.provider', 'provider')
      // join bookings to make sure provider has none
      .leftJoin('provider.providerBookings', 'b')
      .where('a.isBooked = false')
      .andWhere('a.startTime > :now', { now })
      .andWhere('provider.role IN (:...roles)', {
        roles: [
          UserRole.DOCTOR,
          UserRole.NURSE,
          UserRole.PSYCHIATRIST,
          UserRole.CARER,
        ],
      })
      .andWhere('b.id IS NULL') // no bookings at all
      .getMany();

    // unique providers
    const providersMap = new Map<string, User>();
    avail.forEach(a => providersMap.set(a.provider.id, a.provider));
    return Array.from(providersMap.values());
  }

  async getProviderAvailabilities(providerId: string) {
    const now = new Date();
    return this.availabilityRepo.find({
      where: { provider: { id: providerId }, isBooked: false, startTime: Between(now, new Date(9999, 1)) },
    });
  }

  // booking management
  async createBooking(patient: User, dto: CreateBookingDto) {
    console.log('📥 createBooking called with patient:', patient?.email);
    console.log('📥 DTO:', dto);
    
    if (patient.role !== UserRole.PATIENT) {
      console.error('❌ User is not a patient, role:', patient.role);
      throw new ForbiddenException('Only patients can book');
    }
    console.log('✅ Patient role verified');
    
    const provider = await this.bookingRepo.manager.findOne(User, { where: { id: dto.providerId } });
    if (!provider) {
      console.error('❌ Provider not found:', dto.providerId);
      throw new NotFoundException('Provider not found');
    }
    console.log('✅ Provider found:', provider.email);

    // Simplified: Don't require pre-existing availability slots
    // Just create the booking directly (more flexible for real use)
    const booking = this.bookingRepo.create({
      patient,
      provider,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      consultationType: dto.consultationType,
      notes: dto.notes || null,
      status: BookingStatus.PENDING,
    });
    const saved = await this.bookingRepo.save(booking);
    console.log('✅ Booking created successfully:', saved.id);

    // Notify provider via WhatsApp
    const appointmentDate = new Date(dto.startTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const appointmentTime = new Date(dto.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const consultType = dto.consultationType === 'video' ? '📹 Video Consultation' : '👨‍⚕️ Physical Visit';
    
    const approveLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments/${saved.id}/approve`;
    const rejectLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments/${saved.id}/reject`;

    const providerMessage = 
      `🏥 New Appointment Request\n\n` +
      `Patient: ${patient.firstName} ${patient.lastName}\n` +
      `Date: ${appointmentDate}\n` +
      `Time: ${appointmentTime}\n` +
      `Type: ${consultType}\n` +
      `${patient.phone ? `Phone: ${patient.phone}\n` : ''}` +
      `${dto.notes ? `Notes: ${dto.notes}\n\n` : '\n'}` +
      `✅ Approve: ${approveLink}\n` +
      `❌ Reject: ${rejectLink}`;

    // Send WhatsApp notification
    await this.notification.sendWhatsApp(provider.phone, providerMessage);
    
    // Create in-app notification
    await this.notification.createNotification(
      provider,
      `New appointment request from ${patient.firstName} ${patient.lastName} for ${appointmentDate} at ${appointmentTime}`
    );

    return saved;
  }

  async listPatientBookings(patient: User) {
    return this.bookingRepo.find({ where: { patient } });
  }

  async listProviderBookings(provider: User) {
    return this.bookingRepo.find({ where: { provider } });
  }

  async updateBookingStatus(provider: User, id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.provider.id !== provider.id) throw new ForbiddenException();

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Can only approve/reject pending bookings');
    }

    // Update status
    booking.status = dto.status;

    // If approving, generate meeting link for video consultations
    if (dto.status === BookingStatus.CONFIRMED) {
      if (booking.consultationType === 'video') {
        // Generate Jitsi meeting link
        const meetingId = `consultation-${booking.id}-${Date.now()}`;
        booking.meetingLink = `https://meet.jitsi.org/${meetingId}`;
      }
    }

    const result = await this.bookingRepo.save(booking);

    // Format dates/times for notification
    const appointmentDate = new Date(booking.startTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const appointmentTime = new Date(booking.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Notify patient based on approval/rejection
    let patientMsg = '';
    if (dto.status === BookingStatus.CONFIRMED) {
      patientMsg = 
        `✅ Appointment Confirmed!\n\n` +
        `Provider: ${provider.firstName} ${provider.lastName}\n` +
        `Date: ${appointmentDate}\n` +
        `Time: ${appointmentTime}\n`;
      
      if (booking.consultationType === 'video') {
        patientMsg += `📹 Video Consultation\n` +
          `Join Meeting: ${booking.meetingLink}`;
      } else {
        patientMsg += `👨‍⚕️ Physical Visit\n` +
          `Please arrive at the scheduled time.`;
      }
    } else if (dto.status === BookingStatus.REJECTED) {
      patientMsg = 
        `❌ Appointment Declined\n\n` +
        `Provider: ${provider.firstName} ${provider.lastName}\n` +
        `Date: ${appointmentDate}\n` +
        `Time: ${appointmentTime}\n\n` +
        `Please try booking another time or with a different provider.`;
    }

    // Send WhatsApp notification
    if (patientMsg) {
      await this.notification.sendWhatsApp(booking.patient.phone, patientMsg);
      await this.notification.createNotification(booking.patient, patientMsg);
    }

    return result;
  }
}
