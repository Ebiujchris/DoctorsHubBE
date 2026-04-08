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
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

  // Public: get a specific provider's available slots (for patients booking)
  @Get('providers/:id/availabilities')
  async getProviderAvailabilities(@Param('id') id: string) {
    return this.bookingsService.getProviderAvailabilities(id);
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
    
    // Verify user is authenticated and is a patient
    if (!req.user) {
      console.error('❌ No user in request - JWT not validated');
      throw new UnauthorizedException('User not authenticated');
    }
    
    if (!req.user.id) {
      console.error('❌ No user ID in JWT payload');
      throw new UnauthorizedException('Invalid JWT payload - missing user ID');
    }
    
    console.log('✅ JWT validated - Patient ID:', req.user.id);
    console.log('✅ Patient email:', req.user.email);
    
    // Ensure providerId is in DTO
    if (!dto.providerId) {
      throw new BadRequestException('Provider ID is required');
    }
    
    return this.bookingsService.createBooking(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings')
  async getMyBookings(@Request() req) {
    console.log('📥 getMyBookings endpoint called');
    console.log('📥 User:', { id: req.user.id, email: req.user.email, role: req.user.role });
    
    try {
      if (req.user.role === UserRole.PATIENT) {
        console.log('✅ User is patient - fetching patient bookings');
        const bookings = await this.bookingsService.listPatientBookings(req.user);
        console.log('✅ Returning bookings:', bookings.length);
        return bookings;
      } else if (req.user.role === UserRole.DOCTOR || req.user.role === UserRole.NURSE || req.user.role === UserRole.PSYCHIATRIST || req.user.role === UserRole.CARER) {
        console.log('✅ User is provider - fetching provider bookings');
        const bookings = await this.bookingsService.listProviderBookings(req.user);
        console.log('✅ Returning bookings:', bookings.length);
        return bookings;
      } else {
        console.error('❌ Unknown user role:', req.user.role);
        throw new ForbiddenException('Invalid user role');
      }
    } catch (error) {
      console.error('❌ Error in getMyBookings:', error.message);
      throw error;
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

  // Cancel booking endpoint (patient or provider)
  @UseGuards(JwtAuthGuard)
  @Patch('bookings/:id/cancel')
  async cancelBooking(@Request() req, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(req.user, id);
  }
}
