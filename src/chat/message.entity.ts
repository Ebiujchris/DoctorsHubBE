import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  sender: User;

  @ManyToOne(() => User, { eager: true })
  receiver: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
