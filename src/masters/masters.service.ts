import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MasterListQueryDto } from './dto/master-list-query.dto';
import { ParameterListQueryDto } from './dto/parameter-list-query.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

@Injectable()
export class MastersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ==================== Departments ====================
  async findAllDepartments(query: MasterListQueryDto): Promise<PaginatedResult<any>> {
    return this.findAllGeneric('department', query);
  }

  async createDepartment(dto: CreateDepartmentDto, actorProfileId?: number, ip?: string) {
    const created = await this.prisma.department.create({
      data: {
        name: dto.name.trim(),
        isActive: dto.isActive ?? true,
      },
    });
    await this.auditMaster('DEPARTMENT_CREATED', created.id, actorProfileId, ip, { name: created.name });
    return created;
  }

  async updateDepartment(
    id: number,
    dto: UpdateDepartmentDto,
    actorProfileId?: number,
    ip?: string,
  ) {
    await this.ensureExists('department', id);
    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    await this.auditMaster('DEPARTMENT_UPDATED', id, actorProfileId, ip, { changes: { ...dto } });
    return updated;
  }

  async removeDepartment(id: number, actorProfileId?: number, ip?: string) {
    await this.ensureExists('department', id);
    const updated = await this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
    await this.auditMaster('DEPARTMENT_DEACTIVATED', id, actorProfileId, ip);
    return updated;
  }

  async findOneDepartment(id: number) {
    const item = await this.prisma.department.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Department not found');
    return item;
  }

  // ==================== Sites ====================
  async findAllSites(query: MasterListQueryDto): Promise<PaginatedResult<any>> {
    return this.findAllGeneric('site', query);
  }

  async createSite(dto: CreateSiteDto, actorProfileId?: number, ip?: string) {
    const created = await this.prisma.site.create({
      data: { name: dto.name.trim(), isActive: dto.isActive ?? true },
    });
    await this.auditMaster('SITE_CREATED', created.id, actorProfileId, ip, { name: created.name });
    return created;
  }

  async updateSite(id: number, dto: UpdateSiteDto, actorProfileId?: number, ip?: string) {
    await this.ensureExists('site', id);
    const updated = await this.prisma.site.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    await this.auditMaster('SITE_UPDATED', id, actorProfileId, ip, { changes: { ...dto } });
    return updated;
  }

  async removeSite(id: number, actorProfileId?: number, ip?: string) {
    await this.ensureExists('site', id);
    const updated = await this.prisma.site.update({ where: { id }, data: { isActive: false } });
    await this.auditMaster('SITE_DEACTIVATED', id, actorProfileId, ip);
    return updated;
  }

  async findOneSite(id: number) {
    const item = await this.prisma.site.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Site not found');
    return item;
  }

  // ==================== Languages ====================
  async findAllLanguages(query: MasterListQueryDto): Promise<PaginatedResult<any>> {
    return this.findAllGeneric('language', query);
  }

  async createLanguage(dto: CreateLanguageDto, actorProfileId?: number, ip?: string) {
    const created = await this.prisma.language.create({
      data: { name: dto.name.trim(), isActive: dto.isActive ?? true },
    });
    await this.auditMaster('LANGUAGE_CREATED', created.id, actorProfileId, ip, { name: created.name });
    return created;
  }

  async updateLanguage(
    id: number,
    dto: UpdateLanguageDto,
    actorProfileId?: number,
    ip?: string,
  ) {
    await this.ensureExists('language', id);
    const updated = await this.prisma.language.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    await this.auditMaster('LANGUAGE_UPDATED', id, actorProfileId, ip, { changes: { ...dto } });
    return updated;
  }

  async removeLanguage(id: number, actorProfileId?: number, ip?: string) {
    await this.ensureExists('language', id);
    const updated = await this.prisma.language.update({ where: { id }, data: { isActive: false } });
    await this.auditMaster('LANGUAGE_DEACTIVATED', id, actorProfileId, ip);
    return updated;
  }

  async findOneLanguage(id: number) {
    const item = await this.prisma.language.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Language not found');
    return item;
  }

  // ==================== Shifts ====================
  async findAllShifts(query: MasterListQueryDto): Promise<PaginatedResult<any>> {
    return this.findAllGeneric('shift', query);
  }

  async createShift(dto: CreateShiftDto, actorProfileId?: number, ip?: string) {
    const data = this.buildShiftData(dto);
    const created = await this.prisma.shift.create({ data });
    await this.auditMaster('SHIFT_CREATED', created.id, actorProfileId, ip, { name: created.name });
    return created;
  }

  async updateShift(id: number, dto: UpdateShiftDto, actorProfileId?: number, ip?: string) {
    await this.ensureExists('shift', id);
    const data = this.buildShiftData(dto);
    const updated = await this.prisma.shift.update({ where: { id }, data });
    await this.auditMaster('SHIFT_UPDATED', id, actorProfileId, ip, { changes: { ...dto } });
    return updated;
  }

  async removeShift(id: number, actorProfileId?: number, ip?: string) {
    await this.ensureExists('shift', id);
    const updated = await this.prisma.shift.update({ where: { id }, data: { isActive: false } });
    await this.auditMaster('SHIFT_DEACTIVATED', id, actorProfileId, ip);
    return updated;
  }

  async findOneShift(id: number) {
    const item = await this.prisma.shift.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Shift not found');
    return item;
  }

  // ==================== Document Types ====================
  async findAllDocumentTypes(query: MasterListQueryDto): Promise<PaginatedResult<any>> {
    return this.findAllGeneric('documentType', query);
  }

  async createDocumentType(
    dto: CreateDocumentTypeDto,
    actorProfileId?: number,
    ip?: string,
  ) {
    const created = await this.prisma.documentType.create({
      data: { name: dto.name.trim(), isActive: dto.isActive ?? true },
    });
    await this.auditMaster('DOCUMENT_TYPE_CREATED', created.id, actorProfileId, ip, {
      name: created.name,
    });
    return created;
  }

  async updateDocumentType(
    id: number,
    dto: UpdateDocumentTypeDto,
    actorProfileId?: number,
    ip?: string,
  ) {
    await this.ensureExists('documentType', id);
    const updated = await this.prisma.documentType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    await this.auditMaster('DOCUMENT_TYPE_UPDATED', id, actorProfileId, ip, { changes: { ...dto } });
    return updated;
  }

  async removeDocumentType(id: number, actorProfileId?: number, ip?: string) {
    await this.ensureExists('documentType', id);
    const updated = await this.prisma.documentType.update({
      where: { id },
      data: { isActive: false },
    });
    await this.auditMaster('DOCUMENT_TYPE_DEACTIVATED', id, actorProfileId, ip);
    return updated;
  }

  async findOneDocumentType(id: number) {
    const item = await this.prisma.documentType.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Document type not found');
    return item;
  }

  // ==================== Parameters ====================
  async findAllParameterTypes() {
    return this.prisma.parameterType.findMany({ orderBy: { name: 'asc' } });
  }

  async findAllParameters(query: ParameterListQueryDto): Promise<PaginatedResult<any>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = [25, 50, 100].includes(query.pageSize ?? 25)
      ? query.pageSize ?? 25
      : 25;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.parameterTypeId) {
      where.parameterTypeId = query.parameterTypeId;
    }
    if (query.typeCode) {
      where.parameterType = { name: { contains: query.typeCode, mode: 'insensitive' } };
    }
    if (query.search) {
      where.text = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.parameter.count({ where }),
      this.prisma.parameter.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { displayOrder: 'asc' },
        include: { parameterType: { select: { id: true, name: true } } },
      }),
    ]);

    return {
      items,
      pagination: { page, pageSize, totalPages: Math.ceil(totalItems / pageSize), totalItems },
    };
  }

  // ==================== Metadata definitions ====================
  async findAllFormDefinitions() {
    return this.prisma.formEntity.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        fields: {
          orderBy: { displayOrder: 'asc' },
          include: { documentType: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async findOneFormDefinition(key: string) {
    const item = await this.prisma.formEntity.findUnique({
      where: { key },
      include: {
        fields: {
          orderBy: { displayOrder: 'asc' },
          include: { documentType: { select: { id: true, name: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException('Form definition not found');
    return item;
  }

  async findFormFields(entityKey: string) {
    const entity = await this.prisma.formEntity.findUnique({ where: { key: entityKey } });
    if (!entity) throw new NotFoundException('Form definition not found');
    return this.prisma.formField.findMany({
      where: { entityId: entity.id },
      orderBy: { displayOrder: 'asc' },
      include: { documentType: { select: { id: true, name: true } } },
    });
  }

  // ==================== Helpers ====================
  private async findAllGeneric(
    model: 'department' | 'site' | 'language' | 'shift' | 'documentType',
    query: MasterListQueryDto,
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = [25, 50, 100].includes(query.pageSize ?? 25)
      ? query.pageSize ?? 25
      : 25;
    const skip = (page - 1) * pageSize;

    const allowedSort = ['name', 'createdAt', 'id', 'isActive'];
    const sortBy = query.sortBy && allowedSort.includes(query.sortBy) ? query.sortBy : 'name';
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    const where: any = {};
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.search) {
      where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const [totalItems, items] = await Promise.all([
      (this.prisma[model] as any).count({ where }),
      (this.prisma[model] as any).findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      items,
      pagination: { page, pageSize, totalPages: Math.ceil(totalItems / pageSize), totalItems },
    };
  }

  private async ensureExists(
    model: 'department' | 'site' | 'language' | 'shift' | 'documentType',
    id: number,
  ) {
    const item = await (this.prisma[model] as any).findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`${model} not found`);
  }

  private buildShiftData(dto: CreateShiftDto | UpdateShiftDto): any {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.startTime !== undefined) data.startTime = new Date(`1970-01-01T${dto.startTime}`);
    if (dto.endTime !== undefined) data.endTime = new Date(`1970-01-01T${dto.endTime}`);
    if ('lateMinutes' in dto && dto.lateMinutes !== undefined) data.lateMinutes = dto.lateMinutes;
    if ('halfDayMinutes' in dto && dto.halfDayMinutes !== undefined)
      data.halfDayMinutes = dto.halfDayMinutes;
    if (dto.altStartTime !== undefined)
      data.altStartTime = dto.altStartTime ? new Date(`1970-01-01T${dto.altStartTime}`) : null;
    if (dto.altEndTime !== undefined)
      data.altEndTime = dto.altEndTime ? new Date(`1970-01-01T${dto.altEndTime}`) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return data;
  }

  private async auditMaster(
    action: string,
    entityId: number,
    actorProfileId?: number,
    ip?: string,
    metadata?: Prisma.JsonObject,
  ) {
    await this.audit.log({
      actorProfileId,
      action,
      entityType: 'Master',
      entityId: String(entityId),
      ipAddress: ip,
      metadata,
    });
  }
}
