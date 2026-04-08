import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum NotificationType {
  BOOKING_CREATED = 'booking_created',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_REJECTED = 'booking_rejected',
  BOOKING_CANCELLED = 'booking_cancelled',
  GENERAL = 'general',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
  type: NotificationType;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
