import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // Patient submits a review
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user, dto);
  }

  // Public: get all reviews for a provider
  @Get('provider/:id')
  async getForProvider(@Param('id') id: string) {
    return this.reviewsService.getForProvider(id);
  }

  // Check if a booking already has a review
  @UseGuards(JwtAuthGuard)
  @Get('booking/:bookingId')
  async getByBooking(@Param('bookingId') bookingId: string) {
    const review = await this.reviewsService.getByBooking(bookingId);
    return { review: review || null };
  }
}
