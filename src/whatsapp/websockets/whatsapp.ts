import { Injectable } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { WhatsappGateway } from './socket.gateaway';
import { ContactService } from '../services/contact.service';
import { MessageService } from '../services/message.service';
import { ConnectionService } from '../services/connection.service';
import { StoreManyMessage, StoreMessage } from '../dto/message.dto';

@Injectable()
export class WhatsappService {
  private client: Client;

  constructor(
    private readonly whatsappGateway: WhatsappGateway,
    private readonly contactService: ContactService,
    private readonly messageService: MessageService,
    private readonly connectionService: ConnectionService,
  ) {
    this.client = new Client({
      authStrategy: new LocalAuth(),
    });

    this.client.on('qr', (qr: string) => {
      this.whatsappGateway.emitEvent('newQr', qr);
    });

    this.client.on('ready', async () => {
      let data = {
        session: 'asd2342342347263482342',
        qrcode: 'asdase34234234234234235',
        status: 'Conectado',
      };
      await this.connectionService.updateWhatsapp(1, data);

      this.whatsappGateway.emitEvent('ready', 'WhatsApp is ready!');
      console.log('WhatsApp is ready!');
    });

    this.client.on('message', async (message) => {
      if (
        (message.from != 'status@broadcast' && message.type == 'chat') ||
        message.type == 'image'
      ) {
        const detailContact = await message.getContact();
        let contact = await this.contactService.getContactByNumber(
          detailContact.number,
        );

        if (!contact) {
          const newContact = {
            name: detailContact.name ?? 'Sin Nombre',
            number: detailContact.number,
            profilePicUrl: await this.client.getProfilePicUrl(message.from),
          };
          contact = await this.contactService.create(newContact);
        }

        const newMessage = {
          body: message.body,
          ack: message.ack,
          read: 0,
          mediaType: message.type,
          // mediaUrl: message.type == 'image' ? message.mediaUrl : null,
          fromMe: message.fromMe == false ? 0 : 1,
          contactId: contact,
        };

        const nMessage = await this.messageService.create(newMessage);
        this.whatsappGateway.emitEvent('MessageReceived', nMessage);
      }
    });

    // this.client.initialize();
  }

  async sendMessage(data: StoreMessage, user: number): Promise<void> {
    await this.client.sendMessage(`${data.number}@c.us`, data.message);
    const newMessage = {
      body: data.message,
      ack: 0,
      read: 0,
      mediaType: data.mediaType,
      fromMe: 1,
      contactId: data.contactId,
      // userId: user,
    };
    await this.messageService.create(newMessage);
    // console.log(nMessage);
  }

  async sendManyMessage(data: StoreManyMessage, user: number): Promise<void> {
    data.patients.forEach(async (patient) => {
      setTimeout(async () => {
        this.client.sendMessage(`${patient.number}@c.us`, data.message);

        let contact = await this.contactService.getContactByNumber(
          patient.number,
        );

        if (!contact) {
          const newContact = {
            name: patient.name,
            number: patient.number,
          };
          contact = await this.contactService.create(newContact);
        }

        const newMessage = {
          body: data.message,
          ack: 0,
          read: 0,
          mediaType: 'chat',
          fromMe: 1,
          contactId: contact,
        };

        this.messageService.create(newMessage);
      }, 250);
    });
  }
}
