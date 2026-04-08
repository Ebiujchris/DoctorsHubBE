import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId → socketId map
  private connected = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) { client.disconnect(); return; }

      client.data.user = user;
      this.connected.set(user.id, client.id);
      client.join(`user:${user.id}`);
      console.log(`✅ Chat connected: ${user.email}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user;
    if (user) {
      this.connected.delete(user.id);
      console.log(`❌ Chat disconnected: ${user.email}`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; content: string },
  ) {
    const sender = client.data?.user;
    if (!sender || !data.receiverId || !data.content?.trim()) return;

    const saved = await this.chatService.saveMessage(sender, data.receiverId, data.content.trim());

    const payload = {
      id: saved.id,
      content: saved.content,
      createdAt: saved.createdAt,
      senderId: sender.id,
      senderName: `${sender.firstName} ${sender.lastName}`,
      receiverId: data.receiverId,
    };

    // Send to receiver if online
    this.server.to(`user:${data.receiverId}`).emit('newMessage', payload);
    // Echo back to sender
    client.emit('newMessage', payload);
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string },
  ) {
    const receiver = client.data?.user;
    if (!receiver || !data.senderId) return;
    await this.chatService.markRead(data.senderId, receiver.id);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; isTyping: boolean },
  ) {
    const sender = client.data?.user;
    if (!sender) return;
    this.server.to(`user:${data.receiverId}`).emit('typing', {
      senderId: sender.id,
      isTyping: data.isTyping,
    });
  }
}
