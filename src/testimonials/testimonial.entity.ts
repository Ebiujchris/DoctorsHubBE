import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string; // Optional title for the testimonial

  @Column({ type: 'boolean', default: false })
  isApproved: boolean; // Admin approval for public display

  @CreateDateColumn()
  createdAt: Date;
}