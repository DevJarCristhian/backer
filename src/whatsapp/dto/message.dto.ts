// import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class Message {
  body: string;
  ack?: number;
  read: number;
  mediaType: string;
  mediaUrl?: string;
  fromMe: number;
  isDelete?: number;
  contactId: number;
}
