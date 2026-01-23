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
    return this.serializeBigInt(result);
  }

  private serializeBigInt(value: unknown): unknown {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.serializeBigInt(item));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
          key,
          this.serializeBigInt(val),
        ]),
      );
    }
    return value;
  }
}
