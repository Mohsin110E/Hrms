import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { loggerContext, LogContext } from './logger-context';

@Injectable()
export class LoggerContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const forwarded = req.headers['x-forwarded-for'];
    const context: LogContext = {
      requestId: (req.headers['x-request-id'] as string) || randomUUID(),
      method: req.method,
      url: req.originalUrl || req.url,
      ip: typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'] as string,
      userId: (req as any).user?.userId ?? (req as any).user?.sub,
    };

    res.setHeader('x-request-id', context.requestId as string);
    loggerContext.run(context, () => next());
  }
}
