import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyAuthGuard } from './auth/api-key-auth.guard';
import { AppService } from './app.service';

@Controller()
@UseGuards(ApiKeyAuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
