import { Module } from '@nestjs/common';
// import { TaskController } from './task.controller';
import { PrismaService } from '../prisma.service';
import { TaskService } from './task.service';
import { WhatsappGateway } from 'src/whatsapp/websockets/socket.gateaway';

@Module({
  controllers: [],
  providers: [TaskService, PrismaService, WhatsappGateway],
  exports: [],
})
export class TaskModule {}
