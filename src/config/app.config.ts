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
  email: {
    smtpHost: process.env.SMTP_HOST ?? '',
    smtpPort: parseInt(process.env.SMTP_PORT ?? '587', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER ?? '',
    smtpPass: process.env.SMTP_PASS ?? '',
    from: process.env.EMAIL_FROM ?? 'no-reply@example.com',
  },
  frontendBaseUrl: process.env.FRONTEND_BASE_URL ?? 'http://localhost:3001',
}));
