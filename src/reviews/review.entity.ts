import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Booking } from '../bookings/booking.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  patient: User;

  @ManyToOne(() => User, { eager: true })
  provider: User;

  @ManyToOne(() => Booking, { eager: false, nullable: true })
  booking: Booking;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
