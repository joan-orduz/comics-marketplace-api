import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor, RequestTimeoutException } from "@nestjs/common";
import { catchError, Observable, timeout } from "rxjs";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    private readonly logger = new Logger(TimeoutInterceptor.name);
    private readonly TIMEOUT_MS = 10000;

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, url } = req;
        
        this.logger.log(`[Timeout Guard] Starting with ${this.TIMEOUT_MS}ms limit: ${method} ${url}`);
        
        return next.handle().pipe(
            timeout(this.TIMEOUT_MS),
            catchError(err => {
                if (err.name === 'TimeoutError') {
                    this.logger.error(`[Timeout Guard] Request timed out: ${method} ${url}`);
                    throw new RequestTimeoutException('Request timed out after 10s');
                }
                throw err;
            })
        );
    }
}