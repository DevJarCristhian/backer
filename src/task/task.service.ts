import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsappGateway } from '../whatsapp/websockets/socket.gateaway';
const dayjs = require('dayjs');

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappGateway: WhatsappGateway,
  ) { }
  private readonly logger = new Logger(TaskService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  InProgressTask() {
    const date = dayjs().format('YYYY-MM-DD');
    const minute = dayjs().format('HH:mm');
    this.findTaskCalendar(date, minute);
    this.logger.debug('Search Task ' + date);
  }

  async findTaskCalendar(date: string, hour: string) {
    const calendar = await this.prisma.calendar.findFirst({
      where: {
        deleted: false,
        category: 'Programación',
        status: {
          not: 'Finalizado',
        },
        startDate: new Date(date),
        timeStart: hour,
      },
      select: {
        id: true,
        userId: true,
        _count: {
          select: {
            historySending: true,
          },
        },
        template: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!calendar) {
      return;
    }

    await this.prisma.calendar.update({
      where: {
        id: calendar.id,
      },
      data: {
        status: 'En Proceso',
      },
    });

    await this.prisma.notify.create({
      data: {
        title: `Envio de Mensajes a ${calendar._count.historySending} pacientes`,
        message: `Se ha iniciado el envio de mensajes a las ${hour} del ${date} con la plantilla ${calendar.template.name}`,
        status: 'En Proceso',
        type: 'Mensajes Programados',
        userId: calendar.userId,
      },
    });

    this.whatsappGateway.emitEvent('Notify', 'notify');
  }
}
