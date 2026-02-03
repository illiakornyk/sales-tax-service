import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZipCodeSummary, ZipCodeWithCities } from './types/geography.types';

@Injectable()
export class GeographyService {
  constructor(private readonly prisma: PrismaService) {}

  async getZipCode(zip: string): Promise<ZipCodeWithCities> {
    const result = await this.prisma.zip_codes.findUnique({
      where: { zip },
      include: {
        zip_cities: {
          include: { cities: true },
        },
      },
    });
    if (!result) {
      throw new NotFoundException(`Zip code ${zip} not found`);
    }
    return result;
  }

  async listZipCodesByState(
    stateCode: string,
    skip?: number,
    take?: number,
  ): Promise<ZipCodeSummary[]> {
    const normalizedStateCode = stateCode.trim().toUpperCase();
    const effectiveSkip =
      typeof skip === 'number' && Number.isFinite(skip) ? skip : 0;
    const effectiveTake =
      typeof take === 'number' && Number.isFinite(take) ? take : 50;

    return this.prisma.zip_codes.findMany({
      where: { state_code: normalizedStateCode },
      orderBy: { zip: 'asc' },
      skip: effectiveSkip,
      take: effectiveTake,
      select: {
        zip: true,
        state_code: true,
        county_name: true,
        primary_city_name: true,
      },
    });
  }
}
