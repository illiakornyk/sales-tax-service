import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ROLES, type UserRole } from './constants/roles.constants';

type ApiUser = { role: UserRole };

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
      user?: ApiUser;
    }>();
    const apiKeyHeader = request.headers?.['x-api-key'];
    const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    if (apiKey === process.env.ADMIN_API_KEY) {
      request.user = { role: ROLES.ADMIN };
      return true;
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
