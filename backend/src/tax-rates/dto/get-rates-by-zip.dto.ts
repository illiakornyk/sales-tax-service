import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty } from 'class-validator';

export class GetRatesByZipQueryDto {
  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @IsNotEmpty()
  @IsISO8601()
  at!: string;
}
