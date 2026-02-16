import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ROLES, type UserRole } from './constants/roles.constants';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();
    if (request.user?.role === ROLES.ADMIN) {
      return true;
    }
    throw new ForbiddenException('Admin role required');
  }
}
