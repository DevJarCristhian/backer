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

export interface StoreMessage {
  contactId: number;
  number: string;
  message: string;
  mediaType?: string;
  mediaUrl?: string;
  read?: string;
}

export interface StoreManyMessage {
  message: string;
  mediaUrl?: string;
  patients: {
    patientId: string;
    number: string;
    name: string;
  }[];
}
