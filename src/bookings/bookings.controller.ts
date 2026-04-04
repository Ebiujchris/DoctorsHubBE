import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BookingStatus } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // patient endpoints - public (no auth required for browsing)
  @Get('providers')
  async getAvailableProviders() {
    return this.bookingsService.findAvailableProviders();
  }

  @Post('test/create-availability')
  async testCreateAvailability() {
    console.log('⚠️ TEST ONLY: Setting up availability slots for testing');
    // This is a test endpoint to seed availability slots
    // In production, providers would set their own availability
    
    const availabilitySlots = [];
    
    // Create 7 days of slots starting tomorrow
    for (let day = 1; day <= 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      date.setHours(0, 0, 0, 0);
      
      // Create 4 slots per day: 9AM, 11AM, 2PM, 4PM (1 hour each)
      for (const hour of [9, 11, 14, 16]) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        availabilitySlots.push({
          startTime,
          endTime
        });
      }
    }
    
    return {
      message: `✅ Test availability created`,
      totalSlots: availabilitySlots.length,
      slotsPerDay: 4,
      days: 7,
      slots: availabilitySlots.slice(0, 4) // Show first day
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('bookings')
  async createBooking(@Request() req, @Body() dto: CreateBookingDto) {
    console.log('✅ REQUEST REACHED BOOKING CONTROLLER');
    console.log('📥 Booking request received');
    console.log('📥 Headers:', {
      authorization: req.headers.authorization ? 'Present' : '❌ MISSING',
      contentType: req.headers['content-type'],
    });
    console.log('📥 User from JWT:', req.user);
    console.log('📥 DTO:', dto);
    return this.bookingsService.createBooking(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings')
  async getMyBookings(@Request() req) {
    if (req.user.role === UserRole.PATIENT) {
      return this.bookingsService.listPatientBookings(req.user);
    } else {
      return this.bookingsService.listProviderBookings(req.user);
    }
  }

  // provider availability endpoints
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER)
  @Post('providers/me/availabilities')
  async createAvailability(@Request() req, @Body() dto: CreateAvailabilityDto) {
    return this.bookingsService.createAvailability(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER)
  @Get('providers/me/availabilities')
  async listMyAvailabilities(@Request() req) {
    return this.bookingsService.listMyAvailabilities(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER)
  @Patch('providers/me/availabilities/:id')
  async updateAvailability(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.bookingsService.updateAvailability(req.user, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER)
  @Delete('providers/me/availabilities/:id')
  async removeAvailability(@Request() req, @Param('id') id: string) {
    return this.bookingsService.removeAvailability(req.user, id);
  }

  // booking status change (provider action)
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER)
  @Patch('bookings/:id/status')
  async updateBookingStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateBookingStatus(req.user, id, dto);
  }

  // Approve booking endpoint
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER)
  @Patch('bookings/:id/approve')
  async approveBooking(@Request() req, @Param('id') id: string) {
    const dto = { status: BookingStatus.CONFIRMED } as UpdateBookingStatusDto;
    return this.bookingsService.updateBookingStatus(req.user, id, dto);
  }

  // Reject booking endpoint
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER)
  @Patch('bookings/:id/reject')
  async rejectBooking(@Request() req, @Param('id') id: string) {
    const dto = { status: BookingStatus.REJECTED } as UpdateBookingStatusDto;
    return this.bookingsService.updateBookingStatus(req.user, id, dto);
  }
}
