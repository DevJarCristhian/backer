import { Module } from '@nestjs/common';
import { NotesModule } from './notes/notes.module';
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './access/access.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PeopleModule } from './people/people.module';

@Module({
  imports: [
    PeopleModule,
    WhatsappModule,
    NotesModule,
    AccessModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
