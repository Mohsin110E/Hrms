import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { EmailService } from '../common/services/email.service';
import {
  generateSecureToken,
  sha256,
  desDecrypt,
} from '../common/utils/crypto.util';
import { LoginDto } from './dto/login.dto';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  mustChangePassword: boolean;
  user: {
    id: number;
    username: string;
    userTypeId: number;
    profileId: number;
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly bcryptRounds: number;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlDays: number;
  private readonly maxLoginAttempts: number;
  private readonly lockoutMinutes: number;
  private readonly legacyDesKey?: string;
  private readonly legacyDesIv?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
  ) {
    this.bcryptRounds = this.config.get<number>('app.security.bcryptRounds', 12);
    this.accessTtlSeconds = this.parseTtl(
      this.config.get<string>('app.jwt.accessTtl', '15m'),
    );
    this.refreshTtlDays = this.config.get<number>('app.jwt.refreshTtlDays', 14);
    this.maxLoginAttempts = this.config.get<number>('app.security.maxLoginAttempts', 5);
    this.lockoutMinutes = this.config.get<number>('app.security.lockoutMinutes', 30);
    this.legacyDesKey = this.config.get<string>('LEGACY_DES_KEY');
    this.legacyDesIv = this.config.get<string>('LEGACY_DES_IV');
  }

  private parseTtl(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<LoginResult> {
    const normalizedUsername = dto.username.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
      include: { profile: true, activity: true },
    });

    if (!user) {
      await this.audit.log({
        action: 'LOGIN_FAILED',
        ipAddress: ip,
        metadata: { reason: 'unknown_user', username: normalizedUsername },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isActive === false) {
      await this.audit.log({
        actorProfileId: user.profileId,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: String(user.id),
        ipAddress: ip,
        metadata: { reason: 'inactive_user' },
      });
      throw new UnauthorizedException('Account is inactive');
    }

    const activity = user.activity ?? {
      failedLoginAttempts: 0,
      isLocked: false,
      lockedUntil: null,
    };

    if (activity.isLocked && activity.lockedUntil) {
      if (new Date() < activity.lockedUntil) {
        await this.audit.log({
          actorProfileId: user.profileId,
          action: 'LOGIN_FAILED',
          entityType: 'User',
          entityId: String(user.id),
          ipAddress: ip,
          metadata: { reason: 'locked', lockedUntil: activity.lockedUntil.toISOString() },
        });
        throw new UnauthorizedException('Account is locked. Try again later.');
      }
      // Lock expired; clear it below after a successful attempt.
    }

    const passwordValid = await this.verifyPassword(
      dto.password,
      user.passwordHash,
      user.legacyPasswordEnc,
    );

    if (!passwordValid) {
      await this.recordFailedLogin(user.id, ip, userAgent);
      await this.audit.log({
        actorProfileId: user.profileId,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: String(user.id),
        ipAddress: ip,
        metadata: { reason: 'invalid_password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Successful login: clear lockout and update activity.
    await this.prisma.userActivity.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        lastLoginAt: new Date(),
        lastIpUsed: ip ?? null,
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      },
      update: {
        lastLoginAt: new Date(),
        lastIpUsed: ip ?? null,
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      },
    });

    const session = await this.createSession(user.id, ip, userAgent);

    await this.audit.log({
      actorProfileId: user.profileId,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: String(user.id),
      ipAddress: ip,
      metadata: { sessionId: session.id.toString(), mustChangePassword: user.mustChangePassword },
    });

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: this.accessTtlSeconds,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        username: user.username,
        userTypeId: user.userTypeId,
        profileId: user.profileId,
      },
    };
  }

  async logout(refreshToken: string, ip?: string): Promise<void> {
    const hash = sha256(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
    });

    if (session && !session.revokedAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
          revokedReason: 'logout',
        },
      });
      const user = await this.prisma.user.findUnique({
        where: { id: session.userId },
        select: { profileId: true },
      });
      await this.audit.log({
        actorProfileId: user?.profileId ?? undefined,
        action: 'LOGOUT',
        entityType: 'Session',
        entityId: String(session.id),
        ipAddress: ip,
      });
    }
  }

  async refresh(refreshToken: string, ip?: string, userAgent?: string): Promise<TokenPair> {
    const hash = sha256(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
    });

    if (!session || session.revokedAt || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotation-theft detection: if a token that was already rotated is reused,
    // revoke the whole session family.
    if (session.rotatedAt) {
      await this.revokeSessionFamily(session.userId, session.id, 'rotated_token_reuse');
      throw new UnauthorizedException('Token reused. Session revoked.');
    }

    // Mark current session as rotated.
    await this.prisma.session.update({
      where: { id: session.id },
      data: { rotatedAt: new Date(), lastUsedAt: new Date() },
    });

    const newSession = await this.createSession(session.userId, ip, userAgent);

    await this.audit.log({
      action: 'TOKEN_REFRESHED',
      entityType: 'Session',
      entityId: String(newSession.id),
      ipAddress: ip,
      metadata: { previousSessionId: session.id.toString() },
    });

    return {
      accessToken: newSession.accessToken,
      refreshToken: newSession.refreshToken,
      expiresIn: this.accessTtlSeconds,
    };
  }

  async forgotPassword(email: string, ip?: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        profile: { email: normalizedEmail },
        isActive: true,
      },
      include: { profile: true },
    });

    if (!user) {
      // Same response whether the email exists or not.
      return;
    }

    const rawToken = generateSecureToken(48);
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        requestedIp: ip ?? null,
      },
    });

    await this.audit.log({
      actorProfileId: user.profileId,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: String(user.id),
      ipAddress: ip,
    });

    const frontendBaseUrl = this.config.get<string>('app.frontendBaseUrl', 'http://localhost:3001');
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    await this.email.send({
      to: user.profile.email ?? normalizedEmail,
      subject: 'Reset your HRMS password',
      text: `Hi ${user.profile.name || ''},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.`,
      html: `<p>Hi ${escapeHtml(user.profile.name || '')},</p>
<p>You requested a password reset. Click the link below to set a new password:</p>
<p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p>
<p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>`,
    });
  }

  async resetPassword(
    token: string,
    newPassword: string,
    ip?: string,
  ): Promise<void> {
    const tokenHash = sha256(token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || new Date() > record.expiresAt) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
      select: { id: true, profileId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hash = await bcrypt.hash(newPassword, this.bcryptRounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hash,
          legacyPasswordEnc: null,
          mustChangePassword: false,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date(), usedIp: ip ?? null },
      }),
      this.prisma.userActivity.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          passwordChangedAt: new Date(),
          isPasswordReset: true,
        },
        update: {
          passwordChangedAt: new Date(),
          isPasswordReset: true,
        },
      }),
    ]);

    await this.audit.log({
      actorProfileId: user.profileId,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: String(user.id),
      ipAddress: ip,
    });
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    ip?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { activity: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentValid = await this.verifyPassword(
      currentPassword,
      user.passwordHash,
      user.legacyPasswordEnc,
    );

    if (!currentValid) {
      await this.audit.log({
        actorProfileId: user.profileId,
        action: 'CHANGE_PASSWORD_FAILED',
        entityType: 'User',
        entityId: String(user.id),
        ipAddress: ip,
        metadata: { reason: 'invalid_current_password' },
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hash = await bcrypt.hash(newPassword, this.bcryptRounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hash,
          legacyPasswordEnc: null,
          mustChangePassword: false,
        },
      }),
      this.prisma.userActivity.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          passwordChangedAt: new Date(),
          isPasswordReset: false,
        },
        update: {
          passwordChangedAt: new Date(),
          isPasswordReset: false,
        },
      }),
    ]);

    await this.audit.log({
      actorProfileId: user.profileId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: String(user.id),
      ipAddress: ip,
    });
  }

  private async verifyPassword(
    plain: string,
    passwordHash: string | null,
    legacyPasswordEnc: string | null,
  ): Promise<boolean> {
    if (passwordHash) {
      return bcrypt.compare(plain, passwordHash);
    }
    if (legacyPasswordEnc) {
      const decrypted = desDecrypt(
        legacyPasswordEnc,
        this.legacyDesKey,
        this.legacyDesIv,
      );
      return decrypted !== null && decrypted === plain;
    }
    return false;
  }

  private async recordFailedLogin(
    userId: number,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const now = new Date();
    const existing = await this.prisma.userActivity.findUnique({
      where: { userId },
    });

    const attempts = (existing?.failedLoginAttempts ?? 0) + 1;
    const shouldLock = attempts >= this.maxLoginAttempts;
    const lockedUntil = shouldLock
      ? new Date(now.getTime() + this.lockoutMinutes * 60000)
      : existing?.lockedUntil ?? null;

    await this.prisma.userActivity.upsert({
      where: { userId },
      create: {
        userId,
        failedLoginAttempts: attempts,
        isLocked: shouldLock,
        failedLoginAttemptAt: now,
        lockedUntil,
        lastIpUsed: ip ?? null,
      },
      update: {
        failedLoginAttempts: attempts,
        isLocked: shouldLock,
        failedLoginAttemptAt: now,
        lockedUntil,
        lastIpUsed: ip ?? null,
      },
    });

    if (shouldLock) {
      await this.audit.log({
        action: 'ACCOUNT_LOCKED',
        entityType: 'User',
        entityId: String(userId),
        ipAddress: ip,
        metadata: { failedAttempts: attempts, lockoutMinutes: this.lockoutMinutes },
      });
    }
  }

  private async createSession(
    userId: number,
    ip?: string,
    userAgent?: string,
  ): Promise<{ id: bigint; accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rawRefresh = generateSecureToken(48);
    const refreshHash = sha256(rawRefresh);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTtlDays);

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: refreshHash,
        expiresAt,
        lastUsedAt: new Date(),
        ipAddress: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });

    const payload = {
      sub: user.id,
      profileId: user.profileId,
      userTypeId: user.userTypeId,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.accessTtlSeconds,
    });

    return {
      id: session.id,
      accessToken,
      refreshToken: rawRefresh,
    };
  }

  private async revokeSessionFamily(
    userId: number,
    exceptSessionId: bigint,
    reason: string,
  ): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId,
        id: { not: exceptSessionId },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }
}
