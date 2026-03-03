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

  @Get('providers/:id/availabilities')
  async getProviderAvailabilities(@Param('id') providerId: string) {
    return this.bookingsService.getProviderAvailabilities(providerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bookings')
  async createBooking(@Request() req, @Body() dto: CreateBookingDto) {
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
}
