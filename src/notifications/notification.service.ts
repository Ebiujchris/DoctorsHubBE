import { Injectable, Logger } from '@nestjs/common';
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
        this.logger.warn('Twilio client not configured, skipping message');
        return;
      }

      await this.client.messages.create({
        body: message,
        from: this.from,
        to: `whatsapp:${to}`,
      });
    } catch (error) {
      this.logger.error('failed to send whatsapp message', error?.message || error);
    }
  }

  async createNotification(user: User, message: string) {
    const note = this.notificationRepo.create({ user, message });
    return this.notificationRepo.save(note);
  }

  async listForUser(user: User) {
    return this.notificationRepo.find({ where: { user }, order: { createdAt: 'DESC' } });
  }
}
