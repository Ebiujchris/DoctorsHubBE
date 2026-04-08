import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  async saveMessage(sender: User, receiverId: string, content: string): Promise<Message> {
    const msg = this.messageRepo.create({
      sender,
      receiver: { id: receiverId } as User,
      content,
    });
    return this.messageRepo.save(msg);
  }

  async getHistory(userId: string, otherId: string): Promise<Message[]> {
    return this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('m.receiver', 'receiver')
      .where(
        '(m.senderId = :userId AND m.receiverId = :otherId) OR (m.senderId = :otherId AND m.receiverId = :userId)',
        { userId, otherId },
      )
      .orderBy('m.createdAt', 'ASC')
      .getMany();
  }

  // Get all unique conversation partners for a user
  async getConversations(userId: string): Promise<User[]> {
    const sent = await this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.receiver', 'receiver')
      .where('m.senderId = :userId', { userId })
      .select(['m.id', 'receiver.id', 'receiver.firstName', 'receiver.lastName', 'receiver.role', 'receiver.specialty'])
      .getMany();

    const received = await this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .where('m.receiverId = :userId', { userId })
      .select(['m.id', 'sender.id', 'sender.firstName', 'sender.lastName', 'sender.role', 'sender.specialty'])
      .getMany();

    const map = new Map<string, User>();
    sent.forEach(m => { if (m.receiver) map.set(m.receiver.id, m.receiver) });
    received.forEach(m => { if (m.sender) map.set(m.sender.id, m.sender) });
    return Array.from(map.values());
  }

  async markRead(senderId: string, receiverId: string): Promise<void> {
    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ read: true })
      .where('senderId = :senderId AND receiverId = :receiverId AND read = false', { senderId, receiverId })
      .execute();
  }

  async unreadCount(userId: string): Promise<number> {
    return this.messageRepo.count({ where: { receiver: { id: userId }, read: false } });
  }

  async unreadPerConversation(userId: string): Promise<Record<string, number>> {
    const rows = await this.messageRepo
      .createQueryBuilder('m')
      .select('m.senderId', 'senderId')
      .addSelect('COUNT(*)', 'count')
      .where('m.receiverId = :userId AND m.read = false', { userId })
      .groupBy('m.senderId')
      .getRawMany();

    const result: Record<string, number> = {};
    rows.forEach(r => { result[r.senderId] = parseInt(r.count, 10) });
    return result;
  }
}
