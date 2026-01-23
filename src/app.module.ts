import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GeographyModule } from './geography/geography.module';
import { TaxRatesModule } from './tax-rates/tax-rates.module';

@Module({
  imports: [ConfigModule.forRoot(), GeographyModule, TaxRatesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
