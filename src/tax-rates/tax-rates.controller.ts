import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnlyGuard } from '../auth/admin-only.guard';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';
import { ZipCodePipe } from '../common/pipes/zip-code.pipe';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { GetRatesByZipQueryDto } from './dto/get-rates-by-zip.dto';
import { TaxRatesService } from './tax-rates.service';

@Controller('tax-rates')
@ApiTags('tax-rates')
@ApiHeader({ name: 'x-api-key', required: true })
export class TaxRatesController {
  constructor(private readonly taxRatesService: TaxRatesService) {}

  @Get('zip/:zip')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ summary: 'Get tax rates by ZIP and time' })
  async getRatesByZip(
    @Param('zip', ZipCodePipe) zip: string,
    @Query() query: GetRatesByZipQueryDto,
  ) {
    return this.taxRatesService.getRatesByZip(zip, new Date(query.at));
  }

  @Post()
  @UseGuards(ApiKeyAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Create a new tax rate version' })
  @ApiBody({ type: CreateTaxRateDto })
  async createTaxRate(@Body() dto: CreateTaxRateDto) {
    return this.taxRatesService.createTaxRateVersion(dto);
  }
}
