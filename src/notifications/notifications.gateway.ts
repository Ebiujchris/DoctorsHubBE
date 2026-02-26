import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Gateway responsible for pushing notification events to clients.
 * Clients should connect passing their JWT in the auth query to identify themselves.
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  // When a client connects, we can optionally verify their token
  handleConnection(client: Socket) {
    // token already verified by middleware on client side, but you could decode and
    // store user id in socket.data for easy filtering later.
    const { token } = client.handshake.auth;
    // TODO: validate token and store user id
  }

  // send a notification object to a particular userId room
  pushNotification(userId: string, payload: any) {
    this.server.to(userId).emit('notification', payload);
  }

  // helper when count changes
  pushUnreadCount(userId: string, count: number) {
    this.server.to(userId).emit('unreadCount', { count });
  }

  /**
   * clients join a room corresponding to their user id after connecting
   */
  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.userId);
  }
}
