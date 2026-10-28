import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEntry {
  actorProfileId?: number;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  metadata?: Prisma.JsonObject;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorProfileId: entry.actorProfileId ?? null,
          action: entry.action,
          entityType: entry.entityType ?? null,
          entityId: entry.entityId ?? null,
          ipAddress: entry.ipAddress ?? null,
          metadata: entry.metadata ?? {},
        },
      });
    } catch {
      // Audit logging must never fail the request.
    }
  }
}
