import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

class MockDecimal {
  private readonly value: number;

  constructor(value: number | string | MockDecimal) {
    if (value instanceof MockDecimal) {
      this.value = value.value;
      return;
    }
    this.value = Number(value);
  }

  plus(other: number | string | MockDecimal): MockDecimal {
    return new MockDecimal(
      this.value + Number(other instanceof MockDecimal ? other.value : other),
    );
  }

  mul(other: number | string | MockDecimal): MockDecimal {
    return new MockDecimal(
      this.value * Number(other instanceof MockDecimal ? other.value : other),
    );
  }

  greaterThan(other: number | string | MockDecimal): boolean {
    return (
      this.value > Number(other instanceof MockDecimal ? other.value : other)
    );
  }

  toString(): string {
    return String(this.value);
  }
}

class MockPrismaClientKnownRequestError extends Error {
  code: string;

  constructor(message: string, options: { code: string }) {
    super(message);
    this.code = options.code;
  }
}

jest.mock('../generated/prisma/client', () => ({
  Prisma: {
    Decimal: MockDecimal,
    PrismaClientKnownRequestError: MockPrismaClientKnownRequestError,
  },
}));

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../geography/geography.service', () => ({
  GeographyService: class GeographyService {},
}));

import { Prisma } from '../generated/prisma/client';
import { JurisdictionType } from './dto/create-tax-rate.dto';
import { TaxRatesService } from './tax-rates.service';

type PrismaMock = {
  zip_codes: {
    count: jest.Mock<Promise<number>, [unknown]>;
  };
  cities: {
    findUnique: jest.Mock<Promise<unknown>, [unknown]>;
  };
  zip_cities: {
    findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
  };
  tax_rates: {
    create: jest.Mock<Promise<unknown>, [{ data: unknown }]>;
    findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
  };
};

type GeographyMock = {
  getZipCode: jest.Mock<Promise<unknown>, [string]>;
};

type PrismaDependency = ConstructorParameters<typeof TaxRatesService>[0];
type GeographyDependency = ConstructorParameters<typeof TaxRatesService>[1];

describe('TaxRatesService', () => {
  let service: TaxRatesService;
  let prismaMock: PrismaMock;
  let geographyMock: GeographyMock;

  beforeEach(() => {
    prismaMock = {
      zip_codes: {
        count: jest.fn<Promise<number>, [unknown]>(),
      },
      cities: {
        findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      },
      zip_cities: {
        findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      },
      tax_rates: {
        create: jest.fn<Promise<unknown>, [{ data: unknown }]>(),
        findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      },
    };

    geographyMock = {
      getZipCode: jest.fn<Promise<unknown>, [string]>(),
    };

    service = new TaxRatesService(
      prismaMock as unknown as PrismaDependency,
      geographyMock as unknown as GeographyDependency,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates STATE tax rate version with normalized state code', async () => {
    prismaMock.zip_codes.count.mockResolvedValue(1);
    prismaMock.tax_rates.create.mockResolvedValue(
      makeRateRecord({
        id: 10n,
        jurisdiction_type: JurisdictionType.STATE,
        state_code: 'CA',
        rate: new Prisma.Decimal(0.0625),
        start_time: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    const result = await service.createTaxRateVersion({
      jurisdictionType: JurisdictionType.STATE,
      stateCode: ' ca ',
      rate: 0.0625,
      startTime: '2026-01-01T00:00:00.000Z',
    });

    expect(prismaMock.zip_codes.count).toHaveBeenCalledWith({
      where: { state_code: 'CA' },
    });
    const firstCreateCall: unknown =
      prismaMock.tax_rates.create.mock.calls[0]?.[0];
    expect(isTaxRateCreateCall(firstCreateCall)).toBe(true);
    if (isTaxRateCreateCall(firstCreateCall)) {
      expect(firstCreateCall.data.jurisdiction_type).toBe(
        JurisdictionType.STATE,
      );
      expect(firstCreateCall.data.state_code).toBe('CA');
      expect(firstCreateCall.data.county_name).toBeNull();
    }
    expect(result).toEqual(
      expect.objectContaining({
        id: '10',
        jurisdiction_type: JurisdictionType.STATE,
        state_code: 'CA',
        county_name: null,
        city_id: null,
        rate: '0.0625',
        start_time: '2026-01-01T00:00:00.000Z',
      }),
    );
  });

  it('maps duplicate start_time to ConflictException', async () => {
    prismaMock.zip_codes.count.mockResolvedValue(1);
    prismaMock.tax_rates.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
      }),
    );

    await expect(
      service.createTaxRateVersion({
        jurisdictionType: JurisdictionType.STATE,
        stateCode: 'CA',
        rate: 0.0625,
        startTime: '2026-01-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('calculates total using max city rate for ZIP', async () => {
    geographyMock.getZipCode.mockResolvedValue({
      zip: '05079',
      state_code: 'VT',
      county_name: 'Orange County',
      primary_city_name: 'Vershire',
      zip_cities: [
        { city_id: 2118n, cities: { city_name: 'Vershire' } },
        { city_id: 2119n, cities: { city_name: 'Topsham' } },
      ],
    });

    prismaMock.tax_rates.findMany.mockResolvedValue([
      makeRateRecord({
        jurisdiction_type: JurisdictionType.STATE,
        state_code: 'VT',
        rate: new Prisma.Decimal(0.05),
      }),
      makeRateRecord({
        jurisdiction_type: JurisdictionType.COUNTY,
        state_code: 'VT',
        county_name: 'Orange County',
        rate: new Prisma.Decimal(0.02),
      }),
      makeRateRecord({
        id: 3n,
        jurisdiction_type: JurisdictionType.CITY,
        state_code: 'VT',
        city_id: 2118n,
        rate: new Prisma.Decimal(0.03),
      }),
      makeRateRecord({
        id: 4n,
        jurisdiction_type: JurisdictionType.CITY,
        state_code: 'VT',
        city_id: 2119n,
        rate: new Prisma.Decimal(0.04),
      }),
    ]);

    const result = await service.getRatesByZip(
      '05079',
      new Date('2026-01-01T00:00:00.000Z'),
    );

    expect(Number(result.total_rate)).toBeCloseTo(0.11, 8);
    expect(result.breakdown.max_city_rate).toBe('0.04');
    expect(result.breakdown.max_city).toEqual({
      city_id: '2119',
      city_name: 'Topsham',
    });
  });

  it('throws BadRequestException for invalid "at" timestamp', async () => {
    await expect(
      service.getRatesByZip('05079', new Date('invalid date')),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when county is missing in ZIP mapping', async () => {
    geographyMock.getZipCode.mockResolvedValue({
      zip: '05079',
      state_code: 'VT',
      county_name: null,
      primary_city_name: 'Vershire',
      zip_cities: [{ city_id: 2118n, cities: { city_name: 'Vershire' } }],
    });

    await expect(
      service.getRatesByZip('05079', new Date('2026-01-01T00:00:00.000Z')),
    ).rejects.toThrow(NotFoundException);
  });
});

function makeRateRecord(
  overrides: Partial<{
    id: bigint;
    jurisdiction_type: string;
    state_code: string;
    county_name: string | null;
    city_id: bigint | null;
    rate: InstanceType<typeof Prisma.Decimal>;
    start_time: Date;
    created_at: Date;
    created_by_user_id: bigint | null;
  }> = {},
) {
  return {
    id: 1n,
    jurisdiction_type: JurisdictionType.STATE,
    state_code: 'VT',
    county_name: null,
    city_id: null,
    rate: new Prisma.Decimal(0.05),
    start_time: new Date('2026-01-01T00:00:00.000Z'),
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    created_by_user_id: null,
    ...overrides,
  };
}

function isTaxRateCreateCall(value: unknown): value is {
  data: {
    jurisdiction_type: string;
    state_code: string;
    county_name: string | null;
  };
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = (value as { data?: unknown }).data;
  if (!data || typeof data !== 'object') {
    return false;
  }

  const maybeData = data as {
    jurisdiction_type?: unknown;
    state_code?: unknown;
    county_name?: unknown;
  };

  return (
    typeof maybeData.jurisdiction_type === 'string' &&
    typeof maybeData.state_code === 'string' &&
    (typeof maybeData.county_name === 'string' ||
      maybeData.county_name === null)
  );
}
