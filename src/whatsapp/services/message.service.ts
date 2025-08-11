import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Message } from '../dto/message.dto';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) { }

  async getChats(dto: GetDTO) {
    const { search, perPage, page } = dto;

    const query = Prisma.sql`
  SELECT m.id, m.body, m.read, m.mediaType, m.fromMe, m.createdAt, m.contactId,
         c.name, c.number, c.profilePicUrl
  FROM messages m
  INNER JOIN (
    SELECT contactId, MAX(createdAt) AS latest
    FROM messages
    GROUP BY contactId
  ) latest_msg ON m.contactId = latest_msg.contactId AND m.createdAt = latest_msg.latest
  JOIN contacts c ON c.id = m.contactId
  ${search ? Prisma.sql`
    WHERE c.name LIKE ${`%${search}%`} OR c.number LIKE ${`%${search}%`}
  ` : Prisma.empty}
  ORDER BY m.createdAt DESC
  LIMIT ${parseInt(perPage)} OFFSET ${(parseInt(page) - 1) * parseInt(perPage)};
`;


    const serializedData = await this.prisma.$queryRaw<
      Array<{
        id: number;
        body: string;
        read: boolean;
        mediaType: string;
        fromMe: boolean;
        createdAt: Date;
        contactId: number;
        name: string;
        number: string;
        profilePicUrl: string;
      }>
    >(query);

    const data = serializedData.map((item) => ({
      contactId: item.contactId,
      name: item.name,
      number: item.number,
      mediaType: item.mediaType,
      profilePicUrl: item.profilePicUrl,
      lastMessage: item.body,
      lastMessageDate: item.createdAt,
      fromMe: item.fromMe,
      read: item.read,
      messages: []
    }));

    const totalCountQuery = Prisma.sql`
      SELECT COUNT(*) AS total
      FROM (
        SELECT m.contactId
        FROM messages m
        INNER JOIN (
          SELECT contactId, MAX(createdAt) AS latest
          FROM messages
          GROUP BY contactId
        ) latest_msg ON m.contactId = latest_msg.contactId AND m.createdAt = latest_msg.latest
        JOIN contacts c ON c.id = m.contactId
        ${search ? Prisma.sql`
          WHERE c.name LIKE ${`%${search}%`} OR c.number LIKE ${`%${search}%`}
        ` : Prisma.empty}
      ) AS subquery;
    `;

    const totalResult = await this.prisma.$queryRaw(totalCountQuery);

    let total = 0;
    let last_page = 1;

    if (Array.isArray(totalResult) && totalResult.length > 0) {
      total = Number(totalResult[0].total);
      last_page = Math.ceil(total / parseInt(perPage));
    }

    return {
      data,
      total,
      last_page,
    };
  }

  async getChatByContact(contactId: number) {
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
      },
      where: { contactId },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
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

  async getTemplatebyId(id: number) {
    const message = await this.prisma.templates.findFirst({
      select: {
        message: true,
        contentType: true,
        file: true,
      },
      where: {
        id,
      },
    });
    return message;
  }
}