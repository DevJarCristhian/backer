import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Whatsapp } from '../dto/whatsapp.dto';

@Injectable()
export class ConnectionService {
  constructor(private prisma: PrismaService) {}

  async getWhatsapps() {
    return this.prisma.whatsapps.findMany();
  }

  async registerWhatsapp(data: Whatsapp) {
    await this.prisma.whatsapps.create({
      data: data,
    });
    return 'Whatsapp registrado exitosamente';
  }

  async updateWhatsapp(
    id: number,
    data: { session: string; qrcode: string; status: string },
  ) {
    await this.prisma.whatsapps.update({
      where: { id },
      data,
    });
    return 'Whatsapp actualizado exitosamente';
  }

  async updateStatusWhatsapp(id: number, status: string) {
    await this.prisma.whatsapps.update({
      where: { id },
      data: { status },
    });
    return 'Estado actualizado exitosamente';
  }
}
