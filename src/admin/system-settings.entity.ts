import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'DoctorsHub' })
  siteName: string;

  @Column({ default: 'Connect with healthcare providers' })
  siteDescription: string;

  @Column({ default: false })
  maintenanceMode: boolean;

  @Column({ type: 'text', nullable: true })
  maintenanceMessage: string;

  @Column({ default: true })
  allowRegistrations: boolean;

  @Column({ default: true })
  requireEmailVerification: boolean;

  @Column({ default: 10 })
  maxAppointmentsPerDay: number;

  @Column({ default: 60 })
  appointmentDuration: number;

  @Column({ nullable: true })
  adminEmail: string;

  @Column({ nullable: true })
  supportEmail: string;

  @Column({ default: 'UTC' })
  systemTimezone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}