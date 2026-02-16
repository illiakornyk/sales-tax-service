import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GeographyModule } from './geography/geography.module';
import { TaxRatesModule } from './tax-rates/tax-rates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => {
        const required = ['ADMIN_API_KEY', 'DATABASE_URL'];
        const missing = required.filter((key) => !config[key]);
        if (missing.length) {
          throw new Error(`Missing env vars: ${missing.join(', ')}`);
        }
        return config;
      },
    }),
    GeographyModule,
    TaxRatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
