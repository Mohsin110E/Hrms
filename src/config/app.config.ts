import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  appTimezone: process.env.APP_TIMEZONE ?? 'Asia/Dubai',
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtlDays: parseInt(process.env.REFRESH_TTL_DAYS ?? '14', 10),
  },
  storage: {
    documentsPath: process.env.DOCUMENT_STORAGE_PATH ?? './private-storage/documents',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
    maxLoginAttempts: 5,
    lockoutMinutes: parseInt(process.env.LOCKOUT_MINUTES ?? '30', 10),
  },
}));
