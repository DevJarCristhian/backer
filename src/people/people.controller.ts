import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guard/auth.guard';
import { GetDTO } from '../common/dto/params-dto';
import { Response } from 'express';
import { DoctorService } from './services/doctor.service';
import { VisitorService } from './services/visitor.service';
import { DependentService } from './services/dependent.service';
import { PatientService } from './services/patient.service';
import { UpdatePatientDto } from './dto/patient/update-patient.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveI } from 'src/common/interfaces/user-active.interface';
// import { CreateUserDto } from './dto/dependent/create-dependent.dto';
// import { ActiveUser } from '../common/decorators/active-user.decorator';
// import { UserActiveI } from 'src/common/interfaces/user-active.interface';
// import { CreateRoleDto } from './dto/dependent/dependent-dependent.dto';

@UseGuards(AuthGuard)
@Controller('people')
export class PeopleController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly visitorService: VisitorService,
    private readonly dependentService: DependentService,
    private readonly patientService: PatientService,
  ) {}

  @Get('doctor')
  findAllDoctos(@Query() dto: GetDTO) {
    return this.doctorService.findAll(dto);
  }

  @Post('doctor/export')
  async exportDoctor(@Body() dto: GetDTO, @Res() res: Response) {
    const excelBuffer = await this.doctorService.exportToExcel(dto);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="file.xlsx"');

    return res.end(excelBuffer);
  }

  @Get('visitor')
  findAllVisitors(@Query() dto: GetDTO) {
    return this.visitorService.findAll(dto);
  }

  @Post('visitor/export')
  async exportVisitor(@Body() dto: GetDTO, @Res() res: Response) {
    const excelBuffer = await this.visitorService.exportToExcel(dto);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="file.xlsx"');

    return res.end(excelBuffer);
  }

  @Get('dependent')
  findAllDependents(@Query() dto: GetDTO) {
    return this.dependentService.findAll(dto);
  }

  @Post('dependent/export')
  async exportToExcel(@Body() dto: GetDTO, @Res() res: Response) {
    const excelBuffer = await this.dependentService.exportToExcel(dto);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="file.xlsx"');

    return res.end(excelBuffer);
  }

  @Get('patient')
  findAllPatient(@Query() dto: GetDTO) {
    return this.patientService.findAll(dto);
  }

  @Get('patient/:id')
  findPatientById(@Param('id') id: string) {
    return this.patientService.getPatientById(+id);
  }

  @Get('patient/all/maintenance')
  findMaintenance() {
    return this.patientService.getMaintenance();
  }

  @Post('patient/export')
  async exportPatient(@Body() dto: GetDTO, @Res() res: Response) {
    const excelBuffer = await this.patientService.exportToExcel(dto);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="file.xlsx"');

    return res.end(excelBuffer);
  }

  @Get('patient/filter/all')
  findPatient(@Query() dto: GetDTO) {
    return this.patientService.findPatient(dto);
  }

  @Get('patient/filter/select')
  findPatientSelect(@Query() dto: GetDTO) {
    return this.patientService.findPatientSelect(dto);
  }

  @Get('patient/filter/department')
  findDepartment(@Query() dto: GetDTO) {
    return this.patientService.findDepartment(dto);
  }

  @Get('patient/filter/city')
  findCity(@Query() dto: GetDTO) {
    return this.patientService.findCity(dto);
  }

  @Put('patient/:id')
  updatePatient(
    @ActiveUser() user: UserActiveI,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientService.updatePatient(+user.id, +id, dto);
  }
}
