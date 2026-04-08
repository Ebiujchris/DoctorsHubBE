import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('history/:otherId')
  async getHistory(@Request() req, @Param('otherId') otherId: string) {
    return this.chatService.getHistory(req.user.id, otherId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  async getConversations(@Request() req) {
    return this.chatService.getConversations(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread')
  async unreadCount(@Request() req) {
    const count = await this.chatService.unreadCount(req.user.id);
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-per-conversation')
  async unreadPerConversation(@Request() req) {
    return this.chatService.unreadPerConversation(req.user.id);
  }
}
