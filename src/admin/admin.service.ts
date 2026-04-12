import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from './admin.entity';
import { SystemSettings } from './system-settings.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { UsersService } from '../users/users.service';
import { BookingsService } from '../bookings/bookings.service';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AdminService {
  private readonly ADMIN_CODE = process.env.ADMIN_ACCESS_CODE || 'DOCTORSHUB_ADMIN_2026';

  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(SystemSettings)
    private settingsRepository: Repository<SystemSettings>,
    private jwtService: JwtService,
    private usersService: UsersService,
    private bookingsService: BookingsService,
    private testimonialsService: TestimonialsService,
  ) {}

  async register(adminRegisterDto: AdminRegisterDto) {
    const { name, email, password, adminCode } = adminRegisterDto;

    // Verify admin code
    if (adminCode !== this.ADMIN_CODE) {
      throw new BadRequestException('Invalid admin access code');
    }

    // Check if admin already exists
    const existingAdmin = await this.adminRepository.findOne({ where: { email } });
    if (existingAdmin) {
      throw new ConflictException('Admin with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = this.adminRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    const savedAdmin = await this.adminRepository.save(admin);

    // Generate JWT token
    const payload = { sub: savedAdmin.id, email: savedAdmin.email, role: 'admin', name: savedAdmin.name };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      admin: {
        id: savedAdmin.id,
        name: savedAdmin.name,
        email: savedAdmin.email,
        role: savedAdmin.role,
      },
    };
  }

  async login(adminLoginDto: AdminLoginDto) {
    const { email, password } = adminLoginDto;

    // Find admin
    const admin = await this.adminRepository.findOne({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if admin is active
    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { sub: admin.id, email: admin.email, role: 'admin', name: admin.name };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  async getDashboardStats() {
    try {
      // Get total users (patients + providers)
      const totalUsers = await this.usersService.getTotalUsersCount();
      const totalProviders = await this.usersService.getProvidersCount();
      const totalPatients = totalUsers - totalProviders;

      // Get bookings stats
      const totalAppointments = await this.bookingsService.getTotalBookingsCount();
      const pendingApprovals = await this.usersService.getPendingProvidersCount();
      const activeAppointments = await this.bookingsService.getActiveBookingsCount();

      // Get testimonials stats
      const pendingTestimonials = await this.testimonialsService.getPendingCount();

      return {
        totalUsers,
        totalProviders,
        totalPatients,
        totalAppointments,
        pendingApprovals,
        activeAppointments,
        pendingTestimonials,
        monthlyRevenue: 0, // Implement when payment system is added
        systemHealth: 'good'
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  async getRecentActivity() {
    try {
      // Get recent registrations, bookings, etc.
      const recentUsers = await this.usersService.getRecentUsers(5);
      const recentBookings = await this.bookingsService.getRecentBookings(5);
      
      const activities = [];

      // Add recent user registrations
      recentUsers.forEach(user => {
        const isProvider = [UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER].includes(user.role);
        activities.push({
          id: `user-${user.id}`,
          type: isProvider ? 'provider_registration' : 'patient_registration',
          message: `New ${user.role} registered: ${user.firstName} ${user.lastName}`,
          timestamp: user.createdAt,
          user: `${user.firstName} ${user.lastName}`
        });
      });

      // Add recent bookings
      recentBookings.forEach(booking => {
        activities.push({
          id: `booking-${booking.id}`,
          type: 'new_booking',
          message: `New appointment booked`,
          timestamp: booking.createdAt,
          user: booking.patient?.name || 'Unknown'
        });
      });

      // Sort by timestamp (most recent first)
      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  async findById(id: number): Promise<Admin> {
    return this.adminRepository.findOne({ where: { id } });
  }

  // Analytics methods
  async getAnalytics(period: string = '30d') {
    try {
      const days = parseInt(period.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user growth data
      const userGrowth = await this.usersService.getUserGrowthData(startDate);
      
      // Get appointment trends
      const appointmentTrends = await this.bookingsService.getAppointmentTrends(startDate);
      
      // Get popular specialties
      const popularSpecialties = await this.usersService.getPopularSpecialties();

      return {
        userGrowth: userGrowth || [],
        appointmentTrends: appointmentTrends || [],
        popularSpecialties: popularSpecialties || [],
        revenueData: [], // Implement when payment system is added
        period
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        userGrowth: [],
        appointmentTrends: [],
        popularSpecialties: [],
        revenueData: [],
        period
      };
    }
  }

  // Notification methods
  async sendSystemNotification(notification: { 
    title: string; 
    message: string; 
    type: string; 
    targetUsers?: string[] 
  }) {
    try {
      // This is a basic implementation
      // In production, you'd integrate with a proper notification service
      console.log('📢 System notification sent:', notification);
      
      return {
        message: 'Notification sent successfully',
        notification,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // System Settings methods
  async getSystemSettings() {
    try {
      let settings = await this.settingsRepository.findOne({ where: { id: 1 } });
      
      if (!settings) {
        // Create default settings if none exist
        settings = this.settingsRepository.create({
          id: 1, // Explicitly set ID to 1
          siteName: 'DoctorsHub',
          siteDescription: 'Connect with healthcare providers',
          maintenanceMode: false,
          allowRegistrations: true,
          requireEmailVerification: true,
          maxAppointmentsPerDay: 10,
          appointmentDuration: 60,
          systemTimezone: 'UTC'
        });
        settings = await this.settingsRepository.save(settings);
        console.log('✅ Default system settings created');
      }
      
      return settings;
    } catch (error) {
      console.error('❌ Error getting system settings:', error);
      
      // Return default settings if database is not available
      return {
        id: 1,
        siteName: 'DoctorsHub',
        siteDescription: 'Connect with healthcare providers',
        maintenanceMode: false,
        maintenanceMessage: null,
        allowRegistrations: true,
        requireEmailVerification: true,
        maxAppointmentsPerDay: 10,
        appointmentDuration: 60,
        adminEmail: null,
        supportEmail: null,
        systemTimezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date()
      } as SystemSettings;
    }
  }

  async updateSystemSettings(newSettings: Partial<SystemSettings>) {
    try {
      let settings = await this.settingsRepository.findOne({ where: { id: 1 } });
      
      if (!settings) {
        settings = this.settingsRepository.create(newSettings);
      } else {
        Object.assign(settings, newSettings);
      }
      
      const updatedSettings = await this.settingsRepository.save(settings);
      
      console.log('📝 System settings updated:', updatedSettings);
      
      return {
        message: 'Settings updated successfully',
        settings: updatedSettings
      };
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  async toggleMaintenanceMode(enabled: boolean, message?: string) {
    try {
      const settings = await this.getSystemSettings();
      
      settings.maintenanceMode = enabled;
      if (message !== undefined) {
        settings.maintenanceMessage = message;
      }
      
      await this.settingsRepository.save(settings);
      
      console.log(`🔧 Maintenance mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
      
      return {
        message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
        maintenanceMode: enabled,
        maintenanceMessage: message || settings.maintenanceMessage
      };
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      throw error;
    }
  }

  async isMaintenanceModeEnabled(): Promise<boolean> {
    try {
      const settings = await this.settingsRepository.findOne({ where: { id: 1 } });
      return settings ? settings.maintenanceMode : false;
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      // Default to false if we can't check (don't block the system)
      return false;
    }
  }
}