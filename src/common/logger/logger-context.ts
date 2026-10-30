import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  requestId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  userId?: number | string;
}

export const loggerContext = new AsyncLocalStorage<LogContext>();
