import { Injectable } from '@nestjs/common';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import { WhatsappGateway } from './socket.gateaway';
import { ContactService } from '../services/contact.service';
import { MessageService } from '../services/message.service';
import { ConnectionService } from '../services/connection.service';
import { StoreManyMessage, StoreMessage } from '../dto/message.dto';
import { convertFileToBase64 } from 'src/common/functions';
import { SaveImage } from '../functions';

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
      // try {
      let data = {
        session: 'asd2342342347263482342',
        qrcode: 'asdase34234234234234235',
        status: 'Conectado',
      };
      await this.connectionService.updateWhatsapp(1, data);

      this.whatsappGateway.emitEvent('ready', 'WhatsApp is ready!');
      console.log('WhatsApp is ready!');
      // } catch (error) {
      //   console.log('Error al conectar a WhatsApp:', error);
      // }
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

        let image = null;
        if (message.hasMedia) {
          const media = await message.downloadMedia();
          if (media) {
            image = await SaveImage(media.data, './public/messages');
          }
        }

        const newMessage = {
          body: message.body,
          ack: message.ack,
          read: 0,
          mediaType: message.type,
          mediaUrl: image,
          fromMe: message.fromMe == false ? 0 : 1,
          contactId: contact,
        };

        const nMessage = await this.messageService.create(newMessage);
        this.whatsappGateway.emitEvent('MessageReceived', nMessage);
      }
    });
    this.client.initialize();
  }

  async sendMessage(
    data: StoreMessage,
    user: number,
    file: string,
  ): Promise<void> {
    let fileBase = null;
    let options: { media?: any } = {};

    if (file) {
      let fileUrl = file.split('/public')[1];
      fileBase = convertFileToBase64(fileUrl);
      options.media = new MessageMedia('image/jpeg', fileBase, 'archivo.jpg');
    }

    const numberId = await this.client.getNumberId(`${data.number}`);

    await this.client.sendMessage(
      `${numberId._serialized}`,
      data.message,
      options,
    );

    const newMessage = {
      body: data.message,
      ack: 0,
      read: 0,
      mediaType: data.mediaType,
      fromMe: 1,
      contactId: parseInt(data.contactId.toString()),
      mediaUrl: file ?? null,
    };

    await this.messageService.create(newMessage);
  }

  async sendManyMessage(data: StoreManyMessage, user: number): Promise<void> {
    let fileBase = null;
    let options: { media?: any } = {};
    let mess = await this.messageService.getTemplatebyId(+data.templateId);

    if (mess.file) {
      let fileUrl = mess.file.split('/public')[1];
      fileBase = convertFileToBase64(fileUrl);

      options.media = new MessageMedia('image/jpeg', fileBase, 'archivo.jpg');
    }

    data.patients.forEach(async (patient) => {
      try {
        const numberId = await this.client.getNumberId(`${patient.number}`);

        if (numberId) {
          setTimeout(async () => {
            await this.client.sendMessage(
              `${numberId._serialized}`,
              mess.message,
              options,
            );

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
              body: mess.message,
              ack: 0,
              read: 0,
              mediaType: mess.file ? 'image' : 'chat',
              fromMe: 1,
              contactId: contact,
              mediaUrl: mess.file ?? null,
            };

            this.messageService.create(newMessage);
          }, 300);
        }
      } catch (error) {
        console.error('Error al verificar el número:', error);
      }
    });
  }
}
