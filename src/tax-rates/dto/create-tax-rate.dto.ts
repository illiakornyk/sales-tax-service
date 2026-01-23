import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { jurisdiction_type } from '../../generated/prisma/enums';

export const JurisdictionType = jurisdiction_type;
export type JurisdictionType = jurisdiction_type;

export class CreateTaxRateDto {
  @ApiProperty({ enum: JurisdictionType })
  @IsEnum(JurisdictionType)
  jurisdictionType!: JurisdictionType;

  @ApiProperty({ example: 'CA', minLength: 2, maxLength: 10 })
  @IsString()
  @Length(2, 10)
  stateCode!: string;

  @ApiPropertyOptional({ example: 'Orange' })
  @ValidateIf(
    (o: CreateTaxRateDto) => o.jurisdictionType === JurisdictionType.COUNTY,
  )
  @IsString()
  @Length(1, 128)
  countyName?: string;

  @ApiPropertyOptional({ example: 123 })
  @ValidateIf(
    (o: CreateTaxRateDto) => o.jurisdictionType === JurisdictionType.CITY,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  cityId?: number;

  @ApiPropertyOptional({ example: 'Los Angeles' })
  @ValidateIf(
    (o: CreateTaxRateDto) => o.jurisdictionType === JurisdictionType.CITY,
  )
  @IsString()
  @Length(1, 128)
  @IsOptional()
  cityName?: string;

  @ApiProperty({ example: 0.0625, minimum: 0, maximum: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  @Max(1)
  rate!: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @IsISO8601()
  startTime!: string;
}
