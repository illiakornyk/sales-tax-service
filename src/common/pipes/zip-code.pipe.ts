import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ZipCodePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const trimmed = value.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      throw new BadRequestException('zip must be a 5-digit string');
    }
    return trimmed;
  }
}
