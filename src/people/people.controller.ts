import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { DependentService } from './services/dependent.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { GetDTO } from '../common/dto/params-dto';
import { Response } from 'express';
import { PatientService } from './services/patient.service';
// import { CreateUserDto } from './dto/dependent/create-dependent.dto';
// import { ActiveUser } from '../common/decorators/active-user.decorator';
// import { UserActiveI } from 'src/common/interfaces/user-active.interface';
// import { CreateRoleDto } from './dto/dependent/dependent-dependent.dto';

@UseGuards(AuthGuard)
@Controller('people')
export class PeopleController {
  constructor(
    private readonly dependentService: DependentService,
    private readonly patientService: PatientService,
  ) {}

  @Get('dependent')
  findAllDependents(@Query() dto: GetDTO) {
    return this.dependentService.findAll(dto);
  }

  @Post('dependent/export')
  async exportToExcel(@Res() res: Response) {
    const excelBuffer = await this.dependentService.exportToExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="file.xlsx"');

    return res.end(excelBuffer);
  }

  @Get('patient')
  findPatient(@Query() dto: GetDTO) {
    return this.patientService.findPatient(dto);
  }
}
