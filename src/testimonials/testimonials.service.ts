import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './testimonial.entity';
import { User } from '../users/entities/user.entity';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial) private testimonialRepo: Repository<Testimonial>,
  ) {}

  async create(user: User, dto: CreateTestimonialDto): Promise<Testimonial> {
    // Check if user already submitted a testimonial
    const existing = await this.testimonialRepo.findOne({ 
      where: { user: { id: user.id } } 
    });
    
    if (existing) {
      throw new BadRequestException('You have already submitted a testimonial. You can only submit one testimonial per account.');
    }

    const testimonial = this.testimonialRepo.create({
      user,
      rating: dto.rating,
      message: dto.message,
      title: dto.title || null,
      isApproved: false, // Requires admin approval
    });

    return this.testimonialRepo.save(testimonial);
  }

  async getApproved(): Promise<any[]> {
    // Get approved testimonials with high ratings for homepage
    const testimonials = await this.testimonialRepo
      .createQueryBuilder('testimonial')
      .leftJoinAndSelect('testimonial.user', 'user')
      .where('testimonial.isApproved = :approved', { approved: true })
      .andWhere('testimonial.rating >= :minRating', { minRating: 4 })
      .orderBy('testimonial.createdAt', 'DESC')
      .limit(6)
      .getMany();

    // Format for frontend with privacy protection
    return testimonials.map(testimonial => ({
      id: testimonial.id,
      name: `${testimonial.user.firstName} ${testimonial.user.lastName.charAt(0)}.`,
      feedback: testimonial.message,
      title: testimonial.title,
      rating: testimonial.rating,
      date: this.formatDate(testimonial.createdAt),
    }));
  }

  async getUserTestimonial(userId: string): Promise<Testimonial | null> {
    return this.testimonialRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async approveTestimonial(id: string): Promise<Testimonial> {
    const testimonial = await this.testimonialRepo.findOne({ where: { id } });
    if (!testimonial) {
      throw new BadRequestException('Testimonial not found');
    }
    
    testimonial.isApproved = true;
    return this.testimonialRepo.save(testimonial);
  }

  async getAllTestimonials(): Promise<Testimonial[]> {
    return this.testimonialRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getPendingCount(): Promise<number> {
    return this.testimonialRepo.count({
      where: { isApproved: false }
    });
  }

  async rejectTestimonial(id: string, reason?: string): Promise<{ message: string; reason?: string }> {
    const testimonial = await this.testimonialRepo.findOne({ where: { id } });
    if (!testimonial) {
      throw new BadRequestException('Testimonial not found');
    }
    
    // For now, we'll delete rejected testimonials
    // In production, you might want to add a 'status' field with 'pending', 'approved', 'rejected'
    await this.testimonialRepo.remove(testimonial);
    
    return { 
      message: 'Testimonial rejected and removed',
      reason: reason || 'No reason provided'
    };
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}