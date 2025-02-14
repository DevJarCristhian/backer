import { Module } from '@nestjs/common';
import { PeopleController } from './people.controller';
import { PrismaService } from '../prisma.service';
import { DependentService } from './services/dependent.service';
import { PatientService } from './services/patient.service';

@Module({
  controllers: [PeopleController],
  providers: [DependentService, PatientService, PrismaService],
  exports: [],
})
export class PeopleModule {}
