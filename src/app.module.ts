import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './access/access.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PeopleModule } from './people/people.module';
import { DataModule } from './data/data.module';
import { SaleModule } from './sale/sale.module';
import { SettingModule } from './setting/setting.module';

@Module({
  imports: [
    PeopleModule,
    WhatsappModule,
    AccessModule,
    AuthModule,
    DataModule,
    SaleModule,
    SettingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
