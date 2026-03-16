import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);
    intercept (context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, url, ip } = req;
        // extract user info if available (for authenticated routes)
        const userId = req.user ? `User:${req.user.id}` : 'Unauthenticated';
        const startTime = Date.now();
        this.logger.log(`Incoming Request: ${method} ${url} from ${ip} (${userId})`);
        // next.handle() calls the controller and returns an Observable of the response
        return next.handle().pipe(
            tap((response) => {
                const duration = Date.now() - startTime;
                const res = context.switchToHttp().getResponse();
                this.logger.log(`Outgoing Response: ${method} ${url} - Status: ${res.statusCode} - Duration: ${duration}ms (${userId})`);
                if ( duration > 2000 ) this.logger.warn(`Slow response detected: ${method} ${url} took ${duration}ms (${userId})`);
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;
                this.logger.error(`Error occurred: ${method} ${url} - Duration: ${duration}ms - User: (${userId})`);
                throw error;
            })
        )
    }
}