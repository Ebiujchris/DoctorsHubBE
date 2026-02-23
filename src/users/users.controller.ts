import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.DOCTOR, UserRole.PSYCHIATRIST) // Only doctors and psychiatrists can view all users
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('role/:role')
  @Roles(UserRole.DOCTOR, UserRole.PSYCHIATRIST)
  async findByRole(@Param('role') role: UserRole) {
    return this.usersService.findByRole(role);
  }
}
