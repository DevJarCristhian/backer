import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './access/access.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PeopleModule } from './people/people.module';
import { DataModule } from './data/data.module';
import { SaleModule } from './sale/sale.module';
import { SettingModule } from './setting/setting.module';
import { CalendarModule } from './calendar/calendar.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    CalendarModule,
    PeopleModule,
    WhatsappModule,
    AccessModule,
    AuthModule,
    DataModule,
    SaleModule,
    SettingModule,
    TaskModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveRoot: '/public',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
