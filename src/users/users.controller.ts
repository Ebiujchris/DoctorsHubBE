import { Controller, Get, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './entities/user.entity';
import { UpdateProfileDto } from '../medical/dto/medical.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.PSYCHIATRIST)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // Public endpoint for fetching healthcare providers by role (for patients)
  @Get('providers/:role')
  async findProvidersByRole(@Param('role') role: string) {
    const validRoles = ['doctor', 'nurse', 'psychiatrist', 'carer'];
    if (!validRoles.includes(role.toLowerCase())) {
      return [];
    }
    return this.usersService.findByRole(role as UserRole);
  }

  // Public endpoint for featured/top-rated doctors
  @Get('featured/doctors')
  async getFeaturedDoctors() {
    const doctors = await this.usersService.findByRole(UserRole.DOCTOR);
    return doctors
      .filter(doc => doc.isActive && doc.isVerified && doc.isApproved)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  }

  // Public endpoint for featured/top-rated nurses
  @Get('featured/nurses')
  async getFeaturedNurses() {
    const nurses = await this.usersService.findByRole(UserRole.NURSE);
    return nurses
      .filter(nurse => nurse.isActive && nurse.isVerified && nurse.isApproved)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  }

  // Public endpoint for featured/top-rated carers
  @Get('featured/carers')
  async getFeaturedCarers() {
    const carers = await this.usersService.findByRole(UserRole.CARER);
    return carers
      .filter(carer => carer.isActive && carer.isVerified && carer.isApproved)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  }

  // Public endpoint for featured/top-rated psychiatrists
  @Get('featured/psychiatrists')
  async getFeaturedPsychiatrists() {
    const psychiatrists = await this.usersService.findByRole(UserRole.PSYCHIATRIST);
    return psychiatrists
      .filter(psy => psy.isActive && psy.isVerified && psy.isApproved)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  }

  // Public search endpoint for all healthcare providers
  @Get('search')
  async searchProviders(@Query('specialty') specialty: string, @Query('location') location: string) {
    return this.usersService.searchProviders(specialty, location);
  }

  @Get('role/:role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.PSYCHIATRIST)
  async findByRole(@Param('role') role: UserRole) {
    return this.usersService.findByRole(role);
  }
}
