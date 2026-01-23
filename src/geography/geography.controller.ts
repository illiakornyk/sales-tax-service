import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';
import { GeographyService } from './geography.service';

@Controller('geography')
@UseGuards(ApiKeyAuthGuard)
export class GeographyController {
  constructor(private readonly geographyService: GeographyService) {}

  @Get('zip/:zip')
  async getZip(@Param('zip') zip: string) {
    const result = await this.geographyService.getZipCode(zip);
    if (!result) {
      throw new NotFoundException(`Zip code ${zip} not found`);
    }
    return result;
  }
}
