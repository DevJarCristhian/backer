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
import { ProductService } from './services/product.service';
import { OpportunityService } from './services/opportunity.service';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveI } from 'src/common/interfaces/user-active.interface';
import { UpdateOpportunityDto } from './dto/opportunity/update-opportunity.dto';
// import { PricesService } from './services/prices.service';
// import { CreateUserDto } from './dto/dependent/create-dependent.dto';
// import { ActiveUser } from '../common/decorators/active-user.decorator';
// import { UserActiveI } from 'src/common/interfaces/user-active.interface';
// import { CreateRoleDto } from './dto/dependent/dependent-dependent.dto';

@UseGuards(AuthGuard)
@Controller('sale')
export class SaleController {
  constructor(
    private readonly productService: ProductService,
    private readonly opportunityService: OpportunityService,
    // private readonly pricesService: PricesService,
  ) {}

  @Get('product')
  findAllDoctos(@Query() dto: GetDTO) {
    return this.productService.findAll(dto);
  }

  @Post('product/export')
  async exportDoctor(@Body() dto: GetDTO, @Res() res: Response) {
    const excelBuffer = await this.productService.exportToExcel(dto);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="file.xlsx"');

    return res.end(excelBuffer);
  }

  @Get('product/filter/all')
  findPatient(@Query() dto: GetDTO) {
    return this.productService.findProduct(dto);
  }

  @Get('opportunity')
  findAllVisitors(@Query() dto: GetDTO) {
    return this.opportunityService.findAll(dto);
  }

  @Get('opportunity/:id')
  findPatientById(@Param('id') id: string) {
    return this.opportunityService.getOpportunityById(+id);
  }

  @Post('opportunity/export')
  async exportVisitor(@Body() dto: GetDTO, @Res() res: Response) {
    const excelBuffer = await this.opportunityService.exportToExcel(dto);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="file.xlsx"');

    return res.end(excelBuffer);
  }

  @Put('opportunity/:id')
  updateOpportunity(
    @ActiveUser() user: UserActiveI,
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    return this.opportunityService.updateOpportunity(+user.id, +id, dto);
  }
}
