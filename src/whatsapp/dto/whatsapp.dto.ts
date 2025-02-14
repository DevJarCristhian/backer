import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class Whatsapp {
  // @IsNumber()
  id?: number;

  @IsString()
  name: string;

  // @IsString()
  session?: string;

  // @IsString()
  qrcode?: string;

  // @IsString()
  status?: string;

  // @IsString()
  battery?: string;

  // @IsBoolean()
  plugged?: boolean;

  // @IsNumber()
  retries?: number;
}
