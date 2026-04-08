import { Controller, Get, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private notification: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  async unreadCount(@Request() req) {
    const count = await this.notification.unreadCount(req.user);
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mark-all-read')
  async markAllRead(@Request() req) {
    return this.notification.markAllRead(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Request() req) {
    return this.notification.listForUser(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.notification.markAsRead(id, req.user);
  }
}
