import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';
import { ZipCodePipe } from '../common/pipes/zip-code.pipe';
import { GeographyService } from './geography.service';

@Controller('geography')
@UseGuards(ApiKeyAuthGuard)
export class GeographyController {
  constructor(private readonly geographyService: GeographyService) {}

  @Get('zip/:zip')
  async getZip(@Param('zip', ZipCodePipe) zip: string) {
    return this.geographyService.getZipCode(zip);
  }
}
