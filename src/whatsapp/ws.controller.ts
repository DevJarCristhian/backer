import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { WhatsappService } from './websockets/whatsapp';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveI } from 'src/common/interfaces/user-active.interface';
import { StoreManyMessage, StoreMessage } from './dto/message.dto';

@UseGuards(AuthGuard)
@Controller('ws')
export class WSController {
  constructor(private readonly wsService: WhatsappService) {}

  @Post('send-message')
  async sendMessage(
    @ActiveUser() user: UserActiveI,
    @Body() body: StoreMessage,
  ) {
    await this.wsService.sendMessage(body, +user.id);
    return 'Message sent successfully';
  }

  @Post('send-many-message')
  async sendManyMessage(
    @ActiveUser() user: UserActiveI,
    @Body() body: StoreManyMessage,
  ) {
    try {
      await this.wsService.sendManyMessage(body, +user.id);
      return { status: 200, message: 'Message sent successfully' };
    } catch (error) {
      return { status: 400, message: 'Error sending message' };
    }
  }
}
