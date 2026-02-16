import { NotFoundException } from '@nestjs/common';
import { GeographyService } from './geography.service';
import { STATE_CODES } from './constants/state-codes';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

type PrismaZipCodesMock = {
  findUnique: jest.Mock;
  findMany: jest.Mock;
};

type PrismaServiceMock = {
  zip_codes: PrismaZipCodesMock;
};

type GeographyPrismaDependency = ConstructorParameters<
  typeof GeographyService
>[0];

describe('GeographyService', () => {
  let service: GeographyService;
  let prismaMock: PrismaServiceMock;

  beforeEach(() => {
    prismaMock = {
      zip_codes: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new GeographyService(
      prismaMock as unknown as GeographyPrismaDependency,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns zip details when zip exists', async () => {
    const zipResult = {
      zip: '05079',
      state_code: 'VT',
      county_name: 'Orange County',
      primary_city_name: 'Vershire',
      zip_cities: [],
    };
    prismaMock.zip_codes.findUnique.mockResolvedValue(zipResult);

    const result = await service.getZipCode('05079');

    expect(prismaMock.zip_codes.findUnique).toHaveBeenCalledWith({
      where: { zip: '05079' },
      include: {
        zip_cities: {
          include: { cities: true },
        },
      },
    });
    expect(result).toEqual(zipResult);
  });

  it('throws NotFoundException when zip does not exist', async () => {
    prismaMock.zip_codes.findUnique.mockResolvedValue(null);

    const result = service.getZipCode('00000');
    await expect(result).rejects.toBeInstanceOf(NotFoundException);
    await expect(result).rejects.toThrow('Zip code 00000 not found');
  });

  it('normalizes state code and applies default pagination', async () => {
    prismaMock.zip_codes.findMany.mockResolvedValue([]);

    await service.listZipCodesByState(' ca ');

    expect(prismaMock.zip_codes.findMany).toHaveBeenCalledWith({
      where: { state_code: 'CA' },
      orderBy: { zip: 'asc' },
      skip: 0,
      take: 50,
      select: {
        zip: true,
        state_code: true,
        county_name: true,
        primary_city_name: true,
      },
    });
  });

  it('returns static state codes list', () => {
    expect(service.getStateCodes()).toBe(STATE_CODES);
  });
});
