import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Booking } from '../bookings/booking.entity';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  provider: User;

  @ManyToOne(() => User, { eager: true })
  patient: User;

  @ManyToOne(() => Booking, { eager: false, nullable: true })
  booking: Booking;

  @Column({ type: 'jsonb' })
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[];

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'date', nullable: true })
  refillDate: string;

  @CreateDateColumn()
  createdAt: Date;
}
