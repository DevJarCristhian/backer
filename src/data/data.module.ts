import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { PrismaService } from '../prisma.service';
import { PharmacyService } from './services/pharmacy.service';
import { InstitutionService } from './services/institution.service';
import { ChainService } from './services/chain.service';
import { DataService } from './services/data.service';

@Module({
  controllers: [DataController],
  providers: [ChainService, InstitutionService, PharmacyService, PrismaService, DataService],
  exports: [],
})
export class DataModule { }
