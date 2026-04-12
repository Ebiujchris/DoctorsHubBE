import { Controller, Post, Get, Body, UseGuards, Request, UnauthorizedException, Query, Param, Patch } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { UsersService } from '../users/users.service';
import { BookingsService } from '../bookings/bookings.service';
import { ReviewsService } from '../reviews/reviews.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly testimonialsService: TestimonialsService,
    private readonly usersService: UsersService,
    private readonly bookingsService: BookingsService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post('auth/register')
  async register(@Body() adminRegisterDto: AdminRegisterDto) {
    return this.adminService.register(adminRegisterDto);
  }

  @Post('auth/login')
  async login(@Body() adminLoginDto: AdminLoginDto) {
    return this.adminService.login(adminLoginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/stats')
  async getDashboardStats(@Request() req) {
    // Check if user is admin (either from admin table or user table with admin role)
    const user = req.user;
    console.log('🔒 Admin dashboard stats request from user:', user);
    
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }
    
    return this.adminService.getDashboardStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/recent-activity')
  async getRecentActivity(@Request() req) {
    // Check if user is admin
    const user = req.user;
    console.log('🔒 Admin recent activity request from user:', user);
    
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }
    
    return this.adminService.getRecentActivity();
  }

  // ===== TESTIMONIALS MANAGEMENT =====
  @UseGuards(JwtAuthGuard)
  @Get('testimonials')
  async getAllTestimonials(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status: string = 'all'
  ) {
    // Check if user is admin
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    console.log('🔒 Admin testimonials request:', { page: pageNum, limit: limitNum, status });
    
    const testimonials = await this.testimonialsService.getAllTestimonials();
    
    // Filter by status if specified
    let filteredTestimonials = testimonials;
    if (status !== 'all') {
      if (status === 'pending') {
        filteredTestimonials = testimonials.filter(t => !t.isApproved);
      } else if (status === 'approved') {
        filteredTestimonials = testimonials.filter(t => t.isApproved);
      }
    }
    
    // Pagination
    const total = filteredTestimonials.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTestimonials = filteredTestimonials.slice(startIndex, endIndex);
    
    return {
      testimonials: paginatedTestimonials,
      total,
      page: pageNum,
      totalPages,
      limit: limitNum
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('testimonials/:id/approve')
  async approveTestimonial(@Request() req, @Param('id') id: string) {
    // Check if user is admin
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    console.log('🔒 Admin approving testimonial:', id);
    return this.testimonialsService.approveTestimonial(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('testimonials/:id/reject')
  async rejectTestimonial(@Request() req, @Param('id') id: string, @Body() body: { reason: string }) {
    // Check if user is admin
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    console.log('🔒 Admin rejecting testimonial:', id, 'Reason:', body.reason);
    
    // For now, we'll just mark as not approved (you could add a rejected field to the entity later)
    // This is a simple implementation - in production you might want to add a 'rejected' status
    return { message: 'Testimonial rejected', reason: body.reason };
  }

  // ===== PROVIDERS MANAGEMENT =====
  @UseGuards(JwtAuthGuard)
  @Get('providers')
  async getAllProviders(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status: string = 'all'
  ) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const providers = await this.usersService.getProviders(pageNum, limitNum, status);
    return providers;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('providers/:id/approve')
  async approveProvider(@Request() req, @Param('id') id: string) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    await this.usersService.verify(id);
    return { message: 'Provider approved successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('providers/:id/suspend')
  async suspendProvider(@Request() req, @Param('id') id: string, @Body() body: { reason: string }) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    await this.usersService.deactivate(id);
    return { message: 'Provider suspended successfully', reason: body.reason };
  }

  // ===== PATIENTS MANAGEMENT =====
  @UseGuards(JwtAuthGuard)
  @Get('patients')
  async getAllPatients(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const patients = await this.usersService.getPatients(pageNum, limitNum);
    return patients;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('patients/:id/suspend')
  async suspendPatient(@Request() req, @Param('id') id: string, @Body() body: { reason: string }) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    await this.usersService.deactivate(id);
    return { message: 'Patient suspended successfully', reason: body.reason };
  }

  // ===== APPOINTMENTS MANAGEMENT =====
  @UseGuards(JwtAuthGuard)
  @Get('appointments')
  async getAllAppointments(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status: string = 'all'
  ) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const appointments = await this.bookingsService.getAppointmentsForAdmin(pageNum, limitNum, status);
    return appointments;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('appointments/:id/status')
  async updateAppointmentStatus(
    @Request() req, 
    @Param('id') id: string, 
    @Body() body: { status: string; reason?: string }
  ) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    const result = await this.bookingsService.updateAppointmentStatusByAdmin(id, body.status, body.reason);
    return result;
  }

  // ===== REVIEWS MANAGEMENT =====
  @UseGuards(JwtAuthGuard)
  @Get('reviews')
  async getAllReviews(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status: string = 'all'
  ) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const reviews = await this.reviewsService.getReviewsForAdmin(pageNum, limitNum, status);
    return reviews;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reviews/:id/moderate')
  async moderateReview(
    @Request() req, 
    @Param('id') id: string, 
    @Body() body: { action: string; reason?: string }
  ) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    const result = await this.reviewsService.moderateReview(id, body.action, body.reason);
    return result;
  }

  // ===== ANALYTICS =====
  @UseGuards(JwtAuthGuard)
  @Get('analytics')
  async getAnalytics(
    @Request() req,
    @Query('period') period: string = '30d'
  ) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    const analytics = await this.adminService.getAnalytics(period);
    return analytics;
  }

  // ===== NOTIFICATIONS =====
  @UseGuards(JwtAuthGuard)
  @Post('notifications/send')
  async sendSystemNotification(
    @Request() req,
    @Body() notification: { 
      title: string; 
      message: string; 
      type: string; 
      targetUsers?: string[] 
    }
  ) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    const result = await this.adminService.sendSystemNotification(notification);
    return result;
  }

  // ===== SYSTEM SETTINGS =====
  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getSystemSettings(@Request() req) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    return this.adminService.getSystemSettings();
  }

  @UseGuards(JwtAuthGuard)
  @Post('settings')
  async updateSystemSettings(@Request() req, @Body() settings: any) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    return this.adminService.updateSystemSettings(settings);
  }

  @UseGuards(JwtAuthGuard)
  @Post('settings/maintenance')
  async toggleMaintenanceMode(@Request() req, @Body() body: { enabled: boolean; message?: string }) {
    const user = req.user;
    if (!user || (user.role !== 'admin' && !user.email?.includes('admin'))) {
      throw new UnauthorizedException('Admin access required');
    }

    return this.adminService.toggleMaintenanceMode(body.enabled, body.message);
  }
}