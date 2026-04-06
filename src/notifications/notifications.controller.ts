import { Controller, Get, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private notification: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Request() req) {
    console.log('📥 GET /notifications - User:', req.user.email);
    const notifications = await this.notification.listForUser(req.user);
    console.log('📤 Returning', notifications.length, 'notifications');
    return notifications;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    console.log('📥 PATCH /notifications/:id/read');
    console.log('   Notification ID:', id);
    console.log('   User:', req.user.email);
    
    return this.notification.markAsRead(id, req.user);
  }
}
