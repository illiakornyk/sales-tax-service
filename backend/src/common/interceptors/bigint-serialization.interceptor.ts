import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntSerializationInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => this.serializeBigInt(data)));
  }

  private serializeBigInt(value: unknown): unknown {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Prisma.Decimal.isDecimal(value as Prisma.Decimal)) {
      return (value as Prisma.Decimal).toString();
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.serializeBigInt(item));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
          key,
          this.serializeBigInt(val),
        ]),
      );
    }
    return value;
  }
}
