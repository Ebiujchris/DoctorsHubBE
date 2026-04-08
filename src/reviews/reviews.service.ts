import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)  private reviewRepo: Repository<Review>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(User)    private userRepo: Repository<User>,
  ) {}

  async create(patient: User, dto: CreateReviewDto): Promise<Review> {
    // Load booking with relations
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
      relations: ['patient', 'provider'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.patient.id !== patient.id) throw new ForbiddenException('Not your booking');
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('You can only review confirmed appointments');
    }

    // One review per booking
    const existing = await this.reviewRepo.findOne({ where: { booking: { id: dto.bookingId } } });
    if (existing) throw new BadRequestException('You have already reviewed this appointment');

    const review = this.reviewRepo.create({
      patient,
      provider: booking.provider,
      booking,
      rating: dto.rating,
      comment: dto.comment || null,
    });
    const saved = await this.reviewRepo.save(review);

    // Recalculate provider's average rating and review count
    const allReviews = await this.reviewRepo.find({ where: { provider: { id: booking.provider.id } } });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await this.userRepo.update(booking.provider.id, {
      rating: Math.round(avg * 10) / 10,
      reviews: allReviews.length,
    });

    return saved;
  }

  async getForProvider(providerId: string): Promise<Review[]> {
    return this.reviewRepo.find({
      where: { provider: { id: providerId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getByBooking(bookingId: string): Promise<Review | null> {
    return this.reviewRepo.findOne({ where: { booking: { id: bookingId } } });
  }
}
