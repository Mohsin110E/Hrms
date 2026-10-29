import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { PiiService } from '../common/services/pii.service';
import {
  FileStorageService,
  UploadedFileLike,
} from '../common/services/file-storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';

export interface PaginatedDocuments<T = any> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly pii: PiiService,
    private readonly storage: FileStorageService,
  ) {}

  @Cron('0 9 * * 1') // Every Monday at 09:00
  async weeklyExpiryAlerts() {
    await this.runExpiryAlerts();
  }

  async findAll(query: ListDocumentsQueryDto): Promise<PaginatedDocuments> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = [25, 50, 100].includes(query.pageSize ?? 25)
      ? query.pageSize ?? 25
      : 25;
    const skip = (page - 1) * pageSize;

    const allowedSort = ['createdAt', 'expiryDate', 'documentTitle', 'documentTypeId'];
    const sortBy = query.sortBy && allowedSort.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (query.profileId) where.profileId = query.profileId;
    if (query.documentTypeId) where.documentTypeId = query.documentTypeId;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { documentTitle: { contains: query.search.trim(), mode: 'insensitive' } },
        { remarks: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }
    if (query.expiringWithinDays !== undefined && query.expiringWithinDays >= 0) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() + query.expiringWithinDays);
      end.setHours(23, 59, 59, 999);
      where.expiryDate = { gte: start, lte: end };
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          documentType: { select: { id: true, name: true } },
          profile: { select: { id: true, name: true, lastName: true } },
          files: {
            where: { isCurrent: true },
            include: {
              file: {
                select: {
                  id: true,
                  originalName: true,
                  mimeType: true,
                  sizeBytes: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((d) => this.sanitizeDocument(d, true)),
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        totalItems,
      },
    };
  }

  async findOne(id: bigint | number) {
    const documentId = typeof id === 'number' ? BigInt(id) : id;
    const item = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        documentType: { select: { id: true, name: true } },
        profile: { select: { id: true, name: true, lastName: true } },
        fieldValues: {
          include: { field: { select: { id: true, fieldName: true, displayName: true } } },
        },
        files: {
          include: {
            file: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                sizeBytes: true,
                storageKey: true,
              },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Document not found');
    return this.sanitizeDocument(item, false);
  }

  async create(dto: CreateDocumentDto, actorProfileId?: number, ip?: string) {
    const identityNoEnc = this.pii.encrypt(dto.identityNo);
    const identityNoHash = this.pii.hash(dto.identityNo);

    const document = await this.prisma.document.create({
      data: {
        profileId: dto.profileId,
        documentTypeId: dto.documentTypeId,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        identityNoEnc,
        identityNoHash,
        documentTitle: dto.documentTitle ?? null,
        remarks: dto.remarks ?? null,
        isSelf: dto.isSelf ?? true,
        isActive: true,
        createdById: actorProfileId ?? null,
      },
      include: {
        documentType: { select: { id: true, name: true } },
        profile: { select: { id: true, name: true, lastName: true } },
      },
    });

    await this.audit.log({
      actorProfileId,
      action: 'DOCUMENT_CREATED',
      entityType: 'Document',
      entityId: document.id.toString(),
      ipAddress: ip,
      metadata: { documentTypeId: dto.documentTypeId, profileId: dto.profileId },
    });

    return this.sanitizeDocument(document, false);
  }

  async update(
    id: bigint | number,
    dto: UpdateDocumentDto,
    actorProfileId?: number,
    ip?: string,
  ) {
    const documentId = typeof id === 'number' ? BigInt(id) : id;
    const existing = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!existing) throw new NotFoundException('Document not found');

    const data: Prisma.DocumentUncheckedUpdateInput = {};
    if (dto.documentTypeId !== undefined) data.documentTypeId = dto.documentTypeId;
    if (dto.issueDate !== undefined) data.issueDate = dto.issueDate ? new Date(dto.issueDate) : null;
    if (dto.expiryDate !== undefined) data.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    if (dto.identityNo !== undefined) {
      data.identityNoEnc = this.pii.encrypt(dto.identityNo);
      data.identityNoHash = this.pii.hash(dto.identityNo);
    }
    if (dto.documentTitle !== undefined) data.documentTitle = dto.documentTitle ?? null;
    if (dto.remarks !== undefined) data.remarks = dto.remarks ?? null;
    if (dto.isSelf !== undefined) data.isSelf = dto.isSelf;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data,
      include: {
        documentType: { select: { id: true, name: true } },
        profile: { select: { id: true, name: true, lastName: true } },
      },
    });

    await this.audit.log({
      actorProfileId,
      action: dto.isActive === false ? 'DOCUMENT_DEACTIVATED' : 'DOCUMENT_UPDATED',
      entityType: 'Document',
      entityId: documentId.toString(),
      ipAddress: ip,
    });

    return this.sanitizeDocument(updated, false);
  }

  async remove(id: bigint | number, actorProfileId?: number, ip?: string) {
    return this.update(id, { isActive: false }, actorProfileId, ip);
  }

  async attachFile(
    documentId: bigint | number,
    file: UploadedFileLike,
    actorProfileId?: number,
    ip?: string,
  ) {
    const docId = typeof documentId === 'number' ? BigInt(documentId) : documentId;
    const document = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!document) throw new NotFoundException('Document not found');

    const stored = await this.storage.saveFile(file);

    const storedFile = await this.prisma.storedFile.create({
      data: {
        originalName: stored.originalName,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: BigInt(stored.sizeBytes),
        sha256: stored.sha256,
        fileTypeId: document.documentTypeId,
        createdById: actorProfileId ?? null,
      },
    });

    const docFile = await this.prisma.documentFile.create({
      data: {
        documentId: docId,
        fileId: storedFile.id,
        isCurrent: true,
        uploadedById: actorProfileId ?? null,
      },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
      },
    });

    await this.audit.log({
      actorProfileId,
      action: 'DOCUMENT_FILE_ATTACHED',
      entityType: 'Document',
      entityId: docId.toString(),
      ipAddress: ip,
      metadata: { fileId: storedFile.id.toString() },
    });

    return docFile;
  }

  async getFileStream(documentId: bigint | number, fileId: bigint | number) {
    const docId = typeof documentId === 'number' ? BigInt(documentId) : documentId;
    const fId = typeof fileId === 'number' ? BigInt(fileId) : fileId;

    const document = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!document) throw new NotFoundException('Document not found');

    const docFile = await this.prisma.documentFile.findFirst({
      where: { documentId: docId, fileId: fId },
      include: { file: true },
    });
    if (!docFile) throw new NotFoundException('File not found');

    const stream = this.storage.readFile(docFile.file.storageKey);
    return {
      stream,
      fileName: docFile.file.originalName,
      mimeType: docFile.file.mimeType,
      sizeBytes: docFile.file.sizeBytes,
    };
  }

  async markFileNonCurrent(
    documentId: bigint | number,
    fileId: bigint | number,
    actorProfileId?: number,
    ip?: string,
  ) {
    const docId = typeof documentId === 'number' ? BigInt(documentId) : documentId;
    const fId = typeof fileId === 'number' ? BigInt(fileId) : fileId;

    const docFile = await this.prisma.documentFile.findFirst({
      where: { documentId: docId, fileId: fId },
    });
    if (!docFile) throw new NotFoundException('File not found');

    await this.prisma.documentFile.update({
      where: { id: docFile.id },
      data: { isCurrent: false },
    });

    await this.audit.log({
      actorProfileId,
      action: 'DOCUMENT_FILE_REMOVED',
      entityType: 'Document',
      entityId: docId.toString(),
      ipAddress: ip,
      metadata: { fileId: fId.toString() },
    });
  }

  async findExpiring(days: number) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);

    return this.prisma.document.findMany({
      where: {
        isActive: true,
        expiryDate: { gte: start, lte: end },
      },
      include: {
        documentType: { select: { id: true, name: true } },
        profile: { select: { id: true, name: true, lastName: true, email: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async findExpired() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.document.findMany({
      where: {
        isActive: true,
        expiryDate: { lt: today },
      },
      include: {
        documentType: { select: { id: true, name: true } },
        profile: { select: { id: true, name: true, lastName: true, email: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async runExpiryAlerts(actorProfileId?: number, ip?: string, runId?: string) {
    const id = runId ?? Date.now().toString();
    const now = new Date();

    const windows = [
      { key: 'expired', days: -1 },
      { key: '7d', days: 7 },
      { key: '1m', days: 30 },
      { key: '3m', days: 90 },
    ] as const;

    for (const window of windows) {
      const documents = await this.getDocumentsForWindow(window.key, window.days);
      for (const doc of documents) {
        const alreadySent = await this.prisma.expiryAlertLog.findUnique({
          where: {
            documentId_alertWindow_runId: {
              documentId: doc.id,
              alertWindow: window.key,
              runId: id,
            },
          },
        });
        if (!alreadySent) {
          // TODO: send actual email; for now log the alert.
          await this.prisma.expiryAlertLog.create({
            data: {
              documentId: doc.id,
              alertWindow: window.key,
              recipients: doc.profile.email ?? '',
              runId: id,
            },
          });
        }
      }
    }

    await this.audit.log({
      actorProfileId,
      action: 'DOCUMENT_SCHEDULER_RUN',
      entityType: 'Scheduler',
      ipAddress: ip,
      metadata: { runId: id, windows: windows.map((w) => w.key) },
    });

    return { runId: id, processedAt: now.toISOString() };
  }

  private async getDocumentsForWindow(key: string, days: number) {
    if (key === 'expired') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setHours(0, 0, 0, 0);
      return this.prisma.document.findMany({
        where: {
          isActive: true,
          expiryDate: { gte: lastMonth, lte: yesterday },
        },
        include: {
          documentType: { select: { id: true, name: true } },
          profile: { select: { id: true, name: true, lastName: true, email: true } },
        },
      });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);
    return this.prisma.document.findMany({
      where: {
        isActive: true,
        expiryDate: { gte: start, lte: end },
      },
      include: {
        documentType: { select: { id: true, name: true } },
        profile: { select: { id: true, name: true, lastName: true, email: true } },
      },
    });
  }

  private sanitizeDocument(document: any, maskPii: boolean) {
    const { identityNoEnc, identityNoHash, ...rest } = document;
    const identityNo = identityNoEnc ? this.pii.decrypt(identityNoEnc) : null;
    return {
      ...rest,
      identityNo: maskPii ? this.pii.mask(identityNo) : identityNo,
    };
  }
}
