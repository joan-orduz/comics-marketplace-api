import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    // Override the canActivate method to allow public routes
    canActivate(context: ExecutionContext) {
        // Check if the route is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
            context.getHandler(), // Check the method handler
            context.getClass(), // Check the controller class
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }
}
