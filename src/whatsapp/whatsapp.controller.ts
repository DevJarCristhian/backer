import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ConnectionService } from './services/connection.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Whatsapp } from './dto/whatsapp.dto';
import { MessageService } from './services/message.service';
import { ContactService } from './services/contact.service';

@UseGuards(AuthGuard)
@Controller('connection')
export class WhatsappController {
  constructor(
    private readonly connectionService: ConnectionService,
    private readonly messageService: MessageService,
    private readonly contactService: ContactService,
  ) {}

  @Get()
  async getWhatsapps() {
    return this.connectionService.getWhatsapps();
  }

  @Post()
  async registerWhatsapp(@Body() data: Whatsapp) {
    return this.connectionService.registerWhatsapp(data);
  }

  @Put('/:id')
  async updateWhatsapp(
    @Param('id') id: number,
    @Body() data: { session: string; qrcode: string; status: string },
  ) {
    return this.connectionService.updateWhatsapp(+id, data);
  }

  @Get('messages')
  async getMessages() {
    return this.messageService.getMessages();
  }

  @Get('contacts')
  async getContacts() {
    return this.contactService.getContacts();
  }
}
