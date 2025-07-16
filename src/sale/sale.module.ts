import { Module } from '@nestjs/common';
import { SaleController } from './sale.controller';
import { PrismaService } from '../prisma.service';
import { ProductService } from './services/product.service';
import { OpportunityService } from './services/opportunity.service';
import { PricesService } from './services/prices.service';

@Module({
  controllers: [SaleController],
  providers: [ProductService, OpportunityService, PricesService, PrismaService],
  exports: [],
})
export class SaleModule {}
