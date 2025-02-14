import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';
// import { Role } from 'src/common/enums/role.enum';

export class CreateUserDto {
  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(4)
  password: string;

  @IsNumber()
  roleId: number;

  @IsNumber()
  whatsappId: number;

  @IsBoolean()
  status: boolean;
}
