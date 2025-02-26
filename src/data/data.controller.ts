import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guard/auth.guard';
import { GetDTO } from '../common/dto/params-dto';
import { Response } from 'express';
import { ChainService } from './services/chain.service';
import { InstitutionService } from './services/institution.service';
import { PharmacyService } from './services/pharmacy.service';

@UseGuards(AuthGuard)
@Controller('data')
export class DataController {
  constructor(
    private readonly chainService: ChainService,
    private readonly institutionService: InstitutionService,
    private readonly pharmacyService: PharmacyService,
  ) {}

  @Get('chain')
  findAllDoctos(@Query() dto: GetDTO) {
    return this.chainService.findAll(dto);
  }

  @Post('chain/export')
  async exportDoctor(@Body() dto: GetDTO, @Res() res: Response) {
    const excelBuffer = await this.chainService.exportToExcel(dto);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="file.xlsx"');

    return res.end(excelBuffer);
  }

  @Get('institution')
  findAllinstitutions(@Query() dto: GetDTO) {
    return this.institutionService.findAll(dto);
  }

  @Post('institution/export')
  async exportinstitution(@Body() dto: GetDTO, @Res() res: Response) {
    const excelBuffer = await this.institutionService.exportToExcel(dto);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="file.xlsx"');

    return res.end(excelBuffer);
  }

  @Get('pharmacy')
  findAllpharmacys(@Query() dto: GetDTO) {
    return this.pharmacyService.findAll(dto);
  }

  @Post('pharmacy/export')
  async exportToExcel(@Body() dto: GetDTO, @Res() res: Response) {
    const excelBuffer = await this.pharmacyService.exportToExcel(dto);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="file.xlsx"');

    return res.end(excelBuffer);
  }

  @Get('pharmacy/filter/all')
  findPatient(@Query() dto: GetDTO) {
    return this.pharmacyService.findPharmacy(dto);
  }
}
