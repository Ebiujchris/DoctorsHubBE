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
    if (patient.role !== UserRole.PATIENT) {
      throw new ForbiddenException('Only patients can book');
    }
    const provider = await this.bookingRepo.manager.findOne(User, { where: { id: dto.providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    // find an availability slot that matches the requested time and is not booked
    const slot = await this.availabilityRepo.findOne({
      where: {
        provider: { id: provider.id },
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        isBooked: false,
      },
    });
    if (!slot) {
      throw new BadRequestException('Selected time slot is no longer available');
    }

    // mark slot booked
    slot.isBooked = true;
    await this.availabilityRepo.save(slot);

    const booking = this.bookingRepo.create({
      patient,
      provider,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      consultationType: dto.consultationType,
    });
    const saved = await this.bookingRepo.save(booking);

    // notify provider
    const link = `${process.env.BASE_URL || ''}/provider/dashboard`;
    const providerMessage = `New booking request from ${patient.firstName} ${patient.lastName}. Please review: ${link}`;
    this.notification.sendWhatsApp(provider.phone, providerMessage);
    await this.notification.createNotification(provider, providerMessage);

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

    // only allow status transition from pending -> confirmed/rejected etc
    booking.status = dto.status;
    if (dto.meetingLink) booking.meetingLink = dto.meetingLink;
    const result = await this.bookingRepo.save(booking);

    // notify patient
    const patientMsgBase = `Your booking with ${provider.firstName} ${provider.lastName} is now ${booking.status}.`;
    let patientMsg = patientMsgBase;
    if (booking.status === BookingStatus.CONFIRMED) {
      if (booking.consultationType === 'video' && booking.meetingLink) {
        patientMsg += ` Join video consultation: ${booking.meetingLink}`;
      } else {
        patientMsg += ` Please arrive for your physical visit at the scheduled time.`;
      }
    }
    this.notification.sendWhatsApp(booking.patient.phone, patientMsg);
    await this.notification.createNotification(booking.patient, patientMsg);

    return result;
  }
}
