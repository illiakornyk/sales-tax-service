import { Module } from '@nestjs/common';
import { GeographyModule } from '../geography/geography.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TaxRatesService } from './tax-rates.service';
import { TaxRatesController } from './tax-rates.controller';

@Module({
  imports: [PrismaModule, GeographyModule],
  providers: [TaxRatesService],
  controllers: [TaxRatesController],
})
export class TaxRatesModule {}
