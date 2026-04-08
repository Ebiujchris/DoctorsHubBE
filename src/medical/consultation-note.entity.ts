import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Booking } from '../bookings/booking.entity';

@Entity('consultation_notes')
export class ConsultationNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  provider: User;

  @ManyToOne(() => User, { eager: true })
  patient: User;

  @ManyToOne(() => Booking, { eager: false, nullable: true })
  booking: Booking;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  recommendation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
