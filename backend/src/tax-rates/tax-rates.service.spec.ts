import { Test, TestingModule } from '@nestjs/testing';
import { GeographyService } from '../geography/geography.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaxRatesService } from './tax-rates.service';

describe('TaxRatesService', () => {
  let service: TaxRatesService;

  beforeEach(async () => {
    const prismaServiceMock = {
      tax_rates: {
        findMany: jest.fn(),
      },
    };
    const geographyServiceMock = {
      getZipCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxRatesService,
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: GeographyService, useValue: geographyServiceMock },
      ],
    }).compile();

    service = module.get<TaxRatesService>(TaxRatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
