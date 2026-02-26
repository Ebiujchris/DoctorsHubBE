// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, In } from 'typeorm';
// import { Notification } from './notification.entity';
// import { UsersService } from '../users/users.service';
// import { CreateNotificationDto } from './dto/create-notification.dto';
// import { NotificationsGateway } from './notifications.gateway';

// @Injectable()
// export class NotificationsService {
//   constructor(
//     @InjectRepository(Notification)
//     private notificationRepository: Repository<Notification>,
//     private usersService: UsersService,
//     private gateway: NotificationsGateway,
//   ) {}

//   async create(dto: CreateNotificationDto): Promise<Notification[]> {
//     // if userId provided create for that user; otherwise send to all users
//     if (dto.userId) {
//       const user = await this.usersService.findById(dto.userId);
//       const notification = this.notificationRepository.create({
//         title: dto.title,
//         message: dto.message,
//         user,
//       });
//       const saved = await this.notificationRepository.save(notification);
//       this.gateway.pushNotification(user.id, saved);
//       this.gateway.pushUnreadCount(user.id, await this.countUnread(user.id));
//       return [saved];
//     }

//     // no userId given, broadcast to everyone
//     const users = await this.usersService.findAll();
//     if (!users.length) {
//       throw new BadRequestException('No users available to send notification');
//     }

//     const notifications: Notification[] = users.map((u) =>
//       this.notificationRepository.create({
//         title: dto.title,
//         message: dto.message,
//         user: u,
//       }),
//     );
//     const savedList = await this.notificationRepository.save(notifications);
//     // emit to each user's room
//     for (const notif of savedList) {
//       this.gateway.pushNotification(notif.user.id, notif);
//       this.gateway.pushUnreadCount(notif.user.id, await this.countUnread(notif.user.id));
//     }
//     return savedList;
//   }

//   async findForUser(userId: string, unreadOnly = false): Promise<Notification[]> {
//     const where: any = { user: { id: userId } };
//     if (unreadOnly) {
//       where.isRead = false;
//     }
//     return this.notificationRepository.find({
//       where,
//       order: { createdAt: 'DESC' },
//     });
//   }

//   async findById(id: string): Promise<Notification> {
//     const notification = await this.notificationRepository.findOne({
//       where: { id },
//       relations: ['user'],
//     });
//     if (!notification) {
//       throw new NotFoundException(`Notification ${id} not found`);
//     }
//     return notification;
//   }

//   async markAsRead(id: string, userId: string): Promise<Notification> {
//     const notification = await this.findById(id);
//     if (notification.user.id !== userId) {
//       throw new BadRequestException('Cannot modify another user\'s notification');
//     }
//     if (!notification.isRead) {
//       notification.isRead = true;
//       await this.notificationRepository.save(notification);
//       // push updated count to user
//       this.gateway.pushUnreadCount(userId, await this.countUnread(userId));
//     }
//     return notification;
//   }

//   async countUnread(userId: string): Promise<number> {
//     return this.notificationRepository.count({
//       where: { user: { id: userId }, isRead: false },
//     });
//   }
// }
