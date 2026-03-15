import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate (context: ExecutionContext): boolean {
    // reads the roles required by the route handler from the metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
        context.getHandler(),
        context.getClass(),
    ]);

    // if no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // extracts the user from the request
    const { user } = context.switchToHttp().getRequest();

    // checks if the user's role is included in the required roles
    return requiredRoles.includes(user.role);
  }

}
