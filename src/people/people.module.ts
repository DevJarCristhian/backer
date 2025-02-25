import { Module } from '@nestjs/common';
import { PeopleController } from './people.controller';
import { PrismaService } from '../prisma.service';
import { DependentService } from './services/dependent.service';
import { PatientService } from './services/patient.service';
import { VisitorService } from './services/visitor.service';
import { DoctorService } from './services/doctor.service';

@Module({
  controllers: [PeopleController],
  providers: [
    DoctorService,
    VisitorService,
    DependentService,
    PatientService,
    PrismaService,
  ],
  exports: [],
})
export class PeopleModule {}
