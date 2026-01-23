import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class GetRatesByZipQueryDto {
  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @IsISO8601()
  at!: string;
}
