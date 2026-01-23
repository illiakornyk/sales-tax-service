import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZipCodeWithCities } from './types/geography.types';

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
}
