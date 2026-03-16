import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let details: any = undefined;

        // case 1: http exception known by NestJS
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exResponse = exception.getResponse();

            if (typeof exResponse === 'object' && exResponse !== null) {
                // class validator returns array of errors in the 'message' property, so we want to keep that structure
                message = Array.isArray(exResponse[message]) 
                    ? 'Validation failed' 
                    : exResponse[message] as string;
                details = Array.isArray(exResponse[message])
                    ? exResponse[message]
                    : undefined;
            } else {
                message = exResponse as string;
            }
        }

        // case 2: database query error TypeORM (e.g. unique constraint violation)
        if (exception instanceof QueryFailedError) {
            const pgError = exception as any;
            // duplicate key value violates unique constraint
            if (pgError.code === '23505') {
                status = HttpStatus.CONFLICT;
                message = 'Resource already exists';
            } else {
                // other database errors
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                message = 'Database error';
                // log this one for intern debug
                this.logger.error('DB Error: ', pgError);
            }
        }
        // case 3: unknown error, log it for internal debug, hide it from client
        else {
            this.logger.error('Unhandled error: ', exception);
        }
        // standarized response structure for all errors
        response.status(status).json({
            succes: false,
            error:  message,
            ...(details && { details }), // only include details if they exist
            path:   request.url,
            timestamp: new Date().toISOString(),
        })

    }

    
}