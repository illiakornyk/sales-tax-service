import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GeographyModule } from './geography/geography.module';

@Module({
  imports: [ConfigModule.forRoot(), GeographyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
