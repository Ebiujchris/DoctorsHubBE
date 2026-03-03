import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private notification: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Request() req) {
    return this.notification.listForUser(req.user);
  }
}
