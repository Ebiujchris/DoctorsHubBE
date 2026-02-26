// import {
//   Controller,
//   Get,
//   Post,
//   Param,
//   Body,
//   Patch,
//   Query,
//   UseGuards,
//   Req,
// } from '@nestjs/common';
// import { NotificationsService } from './notifications.service';
// import { JwtAuthGuard } from '../auth/guards/jwt.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { CreateNotificationDto } from './dto/create-notification.dto';
// import { UpdateNotificationDto } from './dto/update-notification.dto';
// import { UserRole } from '../users/entities/user.entity';

// @Controller('notifications')
// @UseGuards(JwtAuthGuard, RolesGuard)
// export class NotificationsController {
//   constructor(private notificationsService: NotificationsService) {}

//   // list notifications for current user
//   @Get()
//   async findForUser(
//     @Req() req,
//     @Query('unread') unread: string,
//   ) {
//     const userId = req.user.sub;
//     const unreadOnly = unread === 'true';
//     return this.notificationsService.findForUser(userId, unreadOnly);
//   }

//   // count unread notifications
//   @Get('unread-count')
//   async unreadCount(@Req() req) {
//     const userId = req.user.sub;
//     return { count: await this.notificationsService.countUnread(userId) };
//   }

//   // create notification (only certain roles)
//   @Post()
//   @Roles(UserRole.DOCTOR, UserRole.PSYCHIATRIST)
//   async create(@Body() dto: CreateNotificationDto) {
//     return this.notificationsService.create(dto);
//   }

//   // mark as read or update
//   @Patch(':id')
//   async update(
//     @Req() req,
//     @Param('id') id: string,
//     @Body() dto: UpdateNotificationDto,
//   ) {
//     if (dto.isRead !== undefined && dto.isRead) {
//       return this.notificationsService.markAsRead(id, req.user.sub);
//     }
//     // other updates? none for now
//     return this.notificationsService.findById(id);
//   }

//   // get single notification
//   @Get(':id')
//   async findOne(@Req() req, @Param('id') id: string) {
//     const notification = await this.notificationsService.findById(id);
//     if (notification.user.id !== req.user.sub) {
//       // optionally throw or just return unauthorized
//       return {}; // empty or throw, but guard prevents
//     }
//     return notification;
//   }
// }
