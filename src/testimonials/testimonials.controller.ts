import { Controller, Post, Get, Body, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private testimonialsService: TestimonialsService) {}

  // User submits a testimonial about DoctorsHub platform
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() dto: CreateTestimonialDto) {
    return this.testimonialsService.create(req.user, dto);
  }

  // Public: get approved testimonials for homepage
  @Get()
  async getApproved() {
    return this.testimonialsService.getApproved();
  }

  // Get user's own testimonial
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async getMine(@Request() req) {
    const testimonial = await this.testimonialsService.getUserTestimonial(req.user.id);
    return { testimonial: testimonial || null };
  }

  // Admin: approve a testimonial (for testing - in production this would have admin role check)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    return this.testimonialsService.approveTestimonial(id);
  }

  // Admin: get all testimonials (for testing - in production this would have admin role check)
  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  async getAllForAdmin() {
    return this.testimonialsService.getAllTestimonials();
  }
}