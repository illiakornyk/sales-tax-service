import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }
  }
  return undefined;
}

export class GetCurrentTaxRatesQueryDto {
  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  @IsOptional()
  includeState?: boolean;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  @IsOptional()
  includeCounty?: boolean;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  @IsOptional()
  includeCity?: boolean;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  stateSkip?: number;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 500 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  stateTake?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  countySkip?: number;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 500 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  countyTake?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  citySkip?: number;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 500 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  cityTake?: number;
}
