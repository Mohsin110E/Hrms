import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any)?.message ?? 'An error occurred';

    const errors =
      typeof exceptionResponse === 'object' && (exceptionResponse as any)?.errors
        ? (exceptionResponse as any).errors
        : undefined;

    const logPayload = {
      status,
      code: this.statusToCode(status),
      message: Array.isArray(message) ? message.join(', ') : message,
      path: request.originalUrl || request.url,
      method: request.method,
    };

    if (status >= 500) {
      this.logger.error(JSON.stringify(logPayload), exception.stack, 'HttpExceptionFilter');
    } else if (status >= 400) {
      this.logger.warn(JSON.stringify(logPayload), 'HttpExceptionFilter');
    }

    response.status(status).json({
      data: null,
      message: {
        code: this.statusToCode(status),
        text: Array.isArray(message) ? message.join(', ') : message,
      },
      errors,
    });
  }

  private statusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
