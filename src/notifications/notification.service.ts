import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// ts-ignore because we may not have types installed for twilio
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Twilio = require('twilio');
import { Notification } from './notification.entity';
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
        console.warn('⚠️  Twilio client not configured - skipping WhatsApp message');
        console.warn('   To: whatsapp:' + to?.substring(0, 5) + '...');
        console.warn('   Message length:', message.length);
        return;
      }

      console.log('📱 Sending WhatsApp notification');
      console.log('   To:', 'whatsapp:' + to?.substring(0, 5) + '...');
      console.log('   Message length:', message.length);
      
      await this.client.messages.create({
        body: message,
        from: this.from,
        to: `whatsapp:${to}`,
      });
      
      console.log('✅ WhatsApp sent successfully');
    } catch (error) {
      console.error('❌ Failed to send WhatsApp:', error?.message || error);
      this.logger.error('Failed to send whatsapp message', error?.message || error);
    }
  }

  async createNotification(user: User, message: string) {
    try {
      console.log('📬 Creating in-app notification');
      console.log('   For user:', user?.email || user?.id);
      console.log('   Message length:', message.length);
      
      const note = this.notificationRepo.create({ user, message });
      const saved = await this.notificationRepo.save(note);
      
      console.log('✅ Notification saved:', { id: saved.id, userId: saved.user.id });
      return saved;
    } catch (error) {
      console.error('❌ Failed to create notification:', error?.message || error);
      this.logger.error('Failed to create notification', error?.message || error);
      throw error;
    }
  }

  async listForUser(user: User) {
    try {
      console.log('📮 Fetching notifications for user:', user?.email || user?.id);
      
      const notifications = await this.notificationRepo.find({
        where: { user: { id: user.id } },
        order: { createdAt: 'DESC' }
      });
      
      console.log('✅ Found notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error?.message || error);
      this.logger.error('Failed to fetch notifications', error?.message || error);
      throw error;
    }
  }

  async markAsRead(id: string, user: User) {
    try {
      console.log('📖 Marking notification as read');
      console.log('   Notification ID:', id);
      console.log('   User:', user?.email || user?.id);
      
      const notification = await this.notificationRepo.findOne({
        where: { id, user: { id: user.id } }
      });
      
      if (!notification) {
        console.error('❌ Notification not found:', id);
        throw new NotFoundException('Notification not found');
      }
      
      notification.read = true;
      const saved = await this.notificationRepo.save(notification);
      
      console.log('✅ Notification marked as read');
      return saved;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error?.message || error);
      this.logger.error('Failed to mark notification as read', error?.message || error);
      throw error;
    }
  }
}
