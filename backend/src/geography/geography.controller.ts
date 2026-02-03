import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListZipByStateQueryDto } from './dto/list-zip-by-state.dto';
import { GeographyService } from './geography.service';

@Controller('geography')
export class GeographyController {
  constructor(private readonly geographyService: GeographyService) {}

  @Get('state/:stateCode')
  async listByState(
    @Param('stateCode') stateCode: string,
    @Query() query: ListZipByStateQueryDto,
  ) {
    return this.geographyService.listZipCodesByState(
      stateCode,
      query.skip,
      query.take,
    );
  }
}
