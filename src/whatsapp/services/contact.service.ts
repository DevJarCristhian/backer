import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Contact } from '../dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async getContacts() {
    return this.prisma.contacts.findMany({
      distinct: ['number'],
    });
  }

  async create(data: Contact) {
    const contactId = await this.prisma.contacts.create({
      data: data,
    });
    return contactId.id;
  }

  async getContactByNumber(number: string) {
    const contactId = await this.prisma.contacts.findFirst({
      where: {
        number,
      },
    });
    if (!contactId) {
      return null;
    }
    return contactId.id;
  }

  // async update(id: number, data: Whatsapp) {
  //   await this.prisma.whatsapps.update({
  //     where: { id },
  //     data,
  //   });
  //   return 'Whatsapp actualizado exitosamente';
  // }
}
