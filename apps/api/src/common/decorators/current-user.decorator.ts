import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';

/** Injecte `request.user` (posé par `JwtAuthGuard`) dans un paramètre de contrôleur. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
  return request.user;
});
