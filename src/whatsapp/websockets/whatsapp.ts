import { Injectable } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { WhatsappGateway } from './socket.gateaway';
import { ContactService } from '../services/contact.service';
import { MessageService } from '../services/message.service';
import { ConnectionService } from '../services/connection.service';

@Injectable()
export class WhatsappService {
  private client: Client;
  private qr: string;

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
      this.qr = qr;
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
      if (message.from != 'status@broadcast') {
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

    this.client.initialize();
  }

  async sendMessage(to: string, message: string) {
    const contact = await this.contactService.getContactByNumber(to);
    if (!contact) {
      throw new Error('Contact not found');
    }
    await this.client.sendMessage(to, message);
  }
}
