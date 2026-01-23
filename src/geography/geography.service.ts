import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeographyService {
  constructor(private readonly prisma: PrismaService) {}

  async getZipCode(zip: string) {
    return this.prisma.zip_codes.findUnique({
      where: { zip },
      include: {
        zip_cities: {
          include: { cities: true },
        },
      },
    });
  }

  async listZipCitiesByZip(zip: string) {
    return this.prisma.zip_cities.findMany({
      where: { zip },
      include: { cities: true, zip_codes: true },
      orderBy: { city_id: 'asc' },
    });
  }
}
