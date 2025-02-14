import { Module } from '@nestjs/common';
import { WhatsappGateway } from './websockets/socket.gateaway';
import { PrismaService } from '../prisma.service';
import { WhatsappService } from './websockets/whatsapp';
import { WhatsappController } from './whatsapp.controller';
import { ConnectionService } from './services/connection.service';
import { ContactService } from './services/contact.service';
import { MessageService } from './services/message.service';

@Module({
  controllers: [WhatsappController],
  providers: [
    WhatsappGateway,
    WhatsappService,
    PrismaService,
    ConnectionService,
    ContactService,
    MessageService,
  ],
})
export class WhatsappModule {}
