import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Message } from '../dto/message.dto';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async getMessages() {
    const messages = await this.prisma.messages.findMany({
      select: {
        id: true,
        body: true,
        ack: true,
        read: true,
        mediaType: true,
        mediaUrl: true,
        fromMe: true,
        isDelete: true,
        createdAt: true,
        contact: {
          select: {
            id: true,
            name: true,
            number: true,
            profilePicUrl: true,
          },
        },
      },
    });

    const groupedMessages = messages.reduce((acc, message) => {
      const contactId = message.contact.id;

      if (!acc[contactId]) {
        acc[contactId] = {
          contactId: contactId,
          name: message.contact.name,
          number: message.contact.number,
          profilePicUrl: message.contact.profilePicUrl,
          lastMessage: message.body,
          lastMessageDate: message.createdAt,
          fromMe: message.fromMe,
          messages: [],
        };
      }

      acc[contactId].messages.push({
        id: message.id,
        body: message.body,
        ack: message.ack,
        read: message.read,
        mediaType: message.mediaType,
        mediaUrl: message.mediaUrl,
        fromMe: message.fromMe,
        isDelete: message.isDelete,
        createdAt: message.createdAt,
      });

      acc[contactId].lastMessage = message.body;
      acc[contactId].lastMessageDate = message.createdAt;
      acc[contactId].fromMe = message.fromMe;

      return acc;
    }, {});

    const result = Object.values(groupedMessages);
    result.sort((a: any, b: any) => b.lastMessageDate - a.lastMessageDate);

    return result;
  }

  async create(data: Message) {
    const message = await this.prisma.messages.create({
      data: data,
    });

    const contact = await this.prisma.contacts.findUnique({
      where: { id: data.contactId },
      select: {
        id: true,
        name: true,
        profilePicUrl: true,
      },
    });

    const newMessage = {
      id: message.id,
      body: message.body,
      ack: message.ack,
      read: message.read,
      mediaType: message.mediaType,
      mediaUrl: message.mediaUrl,
      fromMe: message.fromMe,
      isDelete: message.isDelete,
      createdAt: message.createdAt,
      profilePicUrl: contact.profilePicUrl,
      name: contact.name,
      contactId: contact.id,
    };

    return newMessage;
  }

  // async update(id: number, data: Whatsapp) {
  //   await this.prisma.whatsapps.update({
  //     where: { id },
  //     data,
  //   });
  //   return 'Whatsapp actualizado exitosamente';
  // }
}
