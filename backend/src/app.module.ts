import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { REQUIRED_ENV_KEYS } from './config/constants/env.constants';
import { GeographyModule } from './geography/geography.module';
import { HealthModule } from './health/health.module';
import { TaxRatesModule } from './tax-rates/tax-rates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => {
        const missing = REQUIRED_ENV_KEYS.filter((key) => !config[key]);
        if (missing.length) {
          throw new Error(`Missing env vars: ${missing.join(', ')}`);
        }
        return config;
      },
    }),
    HealthModule,
    GeographyModule,
    TaxRatesModule,
  ],
})
export class AppModule {}
