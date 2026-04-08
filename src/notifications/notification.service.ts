import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
const Twilio = require('twilio');
import { Notification, NotificationType } from './notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationService {
  private readonly client: any;
  private readonly from: string;
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private config: ConfigService,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.from = `whatsapp:${this.config.get<string>('TWILIO_WHATSAPP_FROM')}`;
    if (sid && token) {
      this.client = Twilio(sid, token);
    }
  }

  async sendWhatsApp(to: string, message: string) {
    try {
      if (!this.client) {
        this.logger.warn('Twilio not configured - skipping WhatsApp');
        return;
      }
      await this.client.messages.create({ body: message, from: this.from, to: `whatsapp:${to}` });
    } catch (error) {
      this.logger.error('Failed to send WhatsApp', error?.message);
    }
  }

  async createNotification(user: User, message: string, type: NotificationType = NotificationType.GENERAL) {
    try {
      const note = this.notificationRepo.create({ user, message, type });
      return await this.notificationRepo.save(note);
    } catch (error) {
      this.logger.error('Failed to create notification', error?.message);
      throw error;
    }
  }

  async listForUser(user: User) {
    return this.notificationRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async unreadCount(user: User): Promise<number> {
    return this.notificationRepo.count({
      where: { user: { id: user.id }, read: false },
    });
  }

  async markAsRead(id: string, user: User) {
    const notification = await this.notificationRepo.findOne({
      where: { id, user: { id: user.id } },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read = true;
    return this.notificationRepo.save(notification);
  }

  async markAllRead(user: User) {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ read: true })
      .where('userId = :userId AND read = false', { userId: user.id })
      .execute();
    return { success: true };
  }
}
