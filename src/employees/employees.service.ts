import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { PiiService } from '../common/services/pii.service';
import { FileStorageService, UploadedFileLike } from '../common/services/file-storage.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { CreateDependantDto } from './dto/create-dependant.dto';
import { UpdateDependantDto } from './dto/update-dependant.dto';

export interface PaginatedEmployees<T = any> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly pii: PiiService,
    private readonly storage: FileStorageService,
  ) {}

  async findAll(query: ListEmployeesQueryDto): Promise<PaginatedEmployees> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = [25, 50, 100].includes(query.pageSize ?? 25)
      ? query.pageSize ?? 25
      : 25;
    const skip = (page - 1) * pageSize;

    const allowedSort = ['name', 'employeeCode', 'dateOfJoining', 'createdAt'];
    const sortBy = query.sortBy && allowedSort.includes(query.sortBy) ? query.sortBy : 'name';
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    const where: any = {};
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.siteId) {
      where.siteId = query.siteId;
    }
    if (query.employeeTypeId) {
      where.employeeTypeId = query.employeeTypeId;
    }
    if (query.departmentId) {
      where.profile = {
        departments: { some: { departmentId: query.departmentId } },
      };
    }
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { employeeCode: { contains: term, mode: 'insensitive' } },
        { profile: { name: { contains: term, mode: 'insensitive' } } },
        { profile: { lastName: { contains: term, mode: 'insensitive' } } },
        { profile: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: sortBy === 'name' ? { profile: { name: sortOrder } } : { [sortBy]: sortOrder },
        include: {
          profile: {
            select: {
              id: true,
              name: true,
              middleName: true,
              lastName: true,
              email: true,
              contactNo: true,
              isSiteAccess: true,
            },
          },
          site: { select: { id: true, name: true } },
          shift: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      items: items.map((e) => this.sanitizeEmployee(e, true)),
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        totalItems,
      },
    };
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            departments: {
              include: { department: { select: { id: true, name: true } } },
            },
          },
        },
        site: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true } },
        reportingTo: {
          select: {
            id: true,
            employeeCode: true,
            profile: { select: { name: true, lastName: true } },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.sanitizeEmployee(employee, false);
  }

  async create(dto: CreateEmployeeDto, actorProfileId?: number, ip?: string) {
    const codeExists = await this.prisma.employee.findUnique({
      where: { employeeCode: dto.employeeCode.trim() },
    });
    if (codeExists) {
      throw new ConflictException('Employee code already exists');
    }

    if (dto.email) {
      const emailExists = await this.prisma.profile.findFirst({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    const profileData: Prisma.ProfileCreateInput = {
      name: dto.firstName.trim(),
      middleName: dto.middleName?.trim() ?? null,
      lastName: dto.lastName?.trim() ?? null,
      email: dto.email?.toLowerCase() ?? null,
      contactNo: dto.contactNo ?? null,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      maritalStatusId: dto.maritalStatusId ?? null,
      genderId: dto.genderId ?? null,
      bloodGroupId: dto.bloodGroupId ?? null,
      nationalityId: dto.nationalityId ?? null,
      visaTypeId: dto.visaTypeId ?? null,
      motherTongueId: dto.motherTongueId ?? null,
      address: dto.address ?? null,
      homeCountryAddress: dto.homeCountryAddress ?? null,
      homeCountryPhoneNo: dto.homeCountryPhoneNo ?? null,
      qualification: dto.qualification ?? null,
      dateOfExit: dto.dateOfExit ? new Date(dto.dateOfExit) : null,
      exitReasonCode: dto.exitReasonCode ?? null,
      isSiteAccess: dto.isSiteAccess ?? false,
    };

    const personIdNumberEnc = this.pii.encrypt(dto.personIdNumber);
    const personIdNumberHash = this.pii.hash(dto.personIdNumber);

    const employee = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.create({ data: profileData });

      const emp = await tx.employee.create({
        data: {
          employeeCode: dto.employeeCode.trim(),
          profileId: profile.id,
          reportingToId: dto.reportingToId ?? null,
          sourceOfHireId: dto.sourceOfHireId ?? null,
          locationId: dto.locationId ?? null,
          siteId: dto.siteId ?? null,
          employeeStatusId: dto.employeeStatusId ?? null,
          employeeTypeId: dto.employeeTypeId ?? null,
          contractTypeId: dto.contractTypeId ?? null,
          workPhone: dto.workPhone ?? null,
          extension: dto.extension ?? null,
          workEmail: dto.workEmail?.toLowerCase() ?? null,
          dateOfJoining: new Date(dto.dateOfJoining),
          dateOfConfirmation: dto.dateOfConfirmation ? new Date(dto.dateOfConfirmation) : null,
          personIdNumberEnc,
          personIdNumberHash,
          designation: dto.designation ?? null,
          shiftId: dto.shiftId ?? null,
          isActive: true,
        } as Prisma.EmployeeUncheckedCreateInput,
        include: {
          profile: {
            include: {
              departments: {
                include: { department: { select: { id: true, name: true } } },
              },
            },
          },
          site: { select: { id: true, name: true } },
          shift: { select: { id: true, name: true } },
        },
      });

      if (dto.departmentIds?.length) {
        await tx.profileDepartment.createMany({
          data: dto.departmentIds.map((departmentId) => ({
            profileId: profile.id,
            departmentId,
          })),
          skipDuplicates: true,
        });
      }

      return emp;
    });

    await this.audit.log({
      actorProfileId,
      action: 'EMPLOYEE_CREATED',
      entityType: 'Employee',
      entityId: String(employee.id),
      ipAddress: ip,
      metadata: { employeeCode: employee.employeeCode, profileId: employee.profileId },
    });

    return this.sanitizeEmployee(employee, false);
  }

  async update(
    id: number,
    dto: UpdateEmployeeDto,
    actorProfileId?: number,
    ip?: string,
  ) {
    const existing = await this.prisma.employee.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    if (dto.employeeCode && dto.employeeCode.trim() !== existing.employeeCode) {
      const codeExists = await this.prisma.employee.findUnique({
        where: { employeeCode: dto.employeeCode.trim() },
      });
      if (codeExists) {
        throw new ConflictException('Employee code already exists');
      }
    }

    if (dto.email && dto.email.toLowerCase() !== existing.profile.email?.toLowerCase()) {
      const emailExists = await this.prisma.profile.findFirst({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    const profileUpdate: Prisma.ProfileUpdateInput = {};
    if (dto.firstName !== undefined) profileUpdate.name = dto.firstName.trim();
    if (dto.middleName !== undefined) profileUpdate.middleName = dto.middleName?.trim() ?? null;
    if (dto.lastName !== undefined) profileUpdate.lastName = dto.lastName?.trim() ?? null;
    if (dto.email !== undefined) profileUpdate.email = dto.email?.toLowerCase() ?? null;
    if (dto.contactNo !== undefined) profileUpdate.contactNo = dto.contactNo ?? null;
    if (dto.dateOfBirth !== undefined)
      profileUpdate.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.maritalStatusId !== undefined) profileUpdate.maritalStatusId = dto.maritalStatusId ?? null;
    if (dto.genderId !== undefined) profileUpdate.genderId = dto.genderId ?? null;
    if (dto.bloodGroupId !== undefined) profileUpdate.bloodGroupId = dto.bloodGroupId ?? null;
    if (dto.nationalityId !== undefined) profileUpdate.nationalityId = dto.nationalityId ?? null;
    if (dto.visaTypeId !== undefined) profileUpdate.visaTypeId = dto.visaTypeId ?? null;
    if (dto.motherTongueId !== undefined) profileUpdate.motherTongueId = dto.motherTongueId ?? null;
    if (dto.address !== undefined) profileUpdate.address = dto.address ?? null;
    if (dto.homeCountryAddress !== undefined) profileUpdate.homeCountryAddress = dto.homeCountryAddress ?? null;
    if (dto.homeCountryPhoneNo !== undefined) profileUpdate.homeCountryPhoneNo = dto.homeCountryPhoneNo ?? null;
    if (dto.qualification !== undefined) profileUpdate.qualification = dto.qualification ?? null;
    if (dto.dateOfExit !== undefined) profileUpdate.dateOfExit = dto.dateOfExit ? new Date(dto.dateOfExit) : null;
    if (dto.exitReasonCode !== undefined) profileUpdate.exitReasonCode = dto.exitReasonCode ?? null;
    if (dto.isSiteAccess !== undefined) profileUpdate.isSiteAccess = dto.isSiteAccess;

    const employeeUpdate: Prisma.EmployeeUncheckedUpdateInput = {};
    if (dto.employeeCode !== undefined) employeeUpdate.employeeCode = dto.employeeCode.trim();
    if (dto.reportingToId !== undefined) employeeUpdate.reportingToId = dto.reportingToId ?? null;
    if (dto.sourceOfHireId !== undefined) employeeUpdate.sourceOfHireId = dto.sourceOfHireId ?? null;
    if (dto.locationId !== undefined) employeeUpdate.locationId = dto.locationId ?? null;
    if (dto.siteId !== undefined) employeeUpdate.siteId = dto.siteId ?? null;
    if (dto.employeeStatusId !== undefined) employeeUpdate.employeeStatusId = dto.employeeStatusId ?? null;
    if (dto.employeeTypeId !== undefined) employeeUpdate.employeeTypeId = dto.employeeTypeId ?? null;
    if (dto.contractTypeId !== undefined) employeeUpdate.contractTypeId = dto.contractTypeId ?? null;
    if (dto.workPhone !== undefined) employeeUpdate.workPhone = dto.workPhone ?? null;
    if (dto.extension !== undefined) employeeUpdate.extension = dto.extension ?? null;
    if (dto.workEmail !== undefined) employeeUpdate.workEmail = dto.workEmail?.toLowerCase() ?? null;
    if (dto.dateOfJoining !== undefined) employeeUpdate.dateOfJoining = new Date(dto.dateOfJoining);
    if (dto.dateOfConfirmation !== undefined)
      employeeUpdate.dateOfConfirmation = dto.dateOfConfirmation ? new Date(dto.dateOfConfirmation) : null;
    if (dto.personIdNumber !== undefined) {
      employeeUpdate.personIdNumberEnc = this.pii.encrypt(dto.personIdNumber);
      employeeUpdate.personIdNumberHash = this.pii.hash(dto.personIdNumber);
    }
    if (dto.designation !== undefined) employeeUpdate.designation = dto.designation ?? null;
    if (dto.shiftId !== undefined) employeeUpdate.shiftId = dto.shiftId ?? null;
    if (dto.isActive !== undefined) employeeUpdate.isActive = dto.isActive;

    const employee = await this.prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: existing.profileId },
        data: profileUpdate,
      });

      if (dto.departmentIds !== undefined) {
        await tx.profileDepartment.deleteMany({
          where: { profileId: existing.profileId },
        });
        if (dto.departmentIds.length) {
          await tx.profileDepartment.createMany({
            data: dto.departmentIds.map((departmentId) => ({
              profileId: existing.profileId,
              departmentId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.employee.update({
        where: { id },
        data: employeeUpdate as Prisma.EmployeeUncheckedUpdateInput,
        include: {
          profile: {
            include: {
              departments: {
                include: { department: { select: { id: true, name: true } } },
              },
            },
          },
          site: { select: { id: true, name: true } },
          shift: { select: { id: true, name: true } },
        },
      });
    });

    await this.audit.log({
      actorProfileId,
      action: dto.isActive === false ? 'EMPLOYEE_DEACTIVATED' : 'EMPLOYEE_UPDATED',
      entityType: 'Employee',
      entityId: String(id),
      ipAddress: ip,
    });

    return this.sanitizeEmployee(employee, false);
  }

  async remove(id: number, actorProfileId?: number, ip?: string) {
    return this.update(id, { isActive: false }, actorProfileId, ip);
  }

  async uploadPhoto(
    id: number,
    file: UploadedFileLike,
    actorProfileId?: number,
    ip?: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const stored = await this.storage.saveFile(file);

    const storedFile = await this.prisma.storedFile.create({
      data: {
        originalName: stored.originalName,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: BigInt(stored.sizeBytes),
        sha256: stored.sha256,
        createdById: actorProfileId ?? null,
      },
    });

    await this.prisma.profile.update({
      where: { id: employee.profileId },
      data: { photoFileId: storedFile.id },
    });

    await this.audit.log({
      actorProfileId,
      action: 'EMPLOYEE_PHOTO_UPLOADED',
      entityType: 'Employee',
      entityId: String(id),
      ipAddress: ip,
      metadata: { fileId: storedFile.id.toString() },
    });

    return {
      fileId: storedFile.id,
      storageKey: storedFile.storageKey,
      originalName: storedFile.originalName,
      mimeType: storedFile.mimeType,
    };
  }

  // ==================== Dependants ====================
  async findDependants(employeeId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { profileId: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.dependant.findMany({
      where: { employeeProfileId: employee.profileId },
      include: {
        dependantProfile: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            contactNo: true,
            dateOfBirth: true,
            genderId: true,
          },
        },
      },
    });
  }

  async createDependant(
    employeeId: number,
    dto: CreateDependantDto,
    actorProfileId?: number,
    ip?: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { profileId: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const dependantProfile = await this.prisma.profile.create({
      data: {
        name: dto.firstName.trim(),
        lastName: dto.lastName?.trim() ?? null,
        email: dto.email?.toLowerCase() ?? null,
        contactNo: dto.contactNo ?? null,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        genderId: dto.genderId ?? null,
      },
    });

    const dependant = await this.prisma.dependant.create({
      data: {
        dependantProfileId: dependantProfile.id,
        employeeProfileId: employee.profileId,
        relationTypeId: dto.relationTypeId ?? null,
      },
      include: {
        dependantProfile: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            contactNo: true,
            dateOfBirth: true,
            genderId: true,
          },
        },
      },
    });

    await this.audit.log({
      actorProfileId,
      action: 'DEPENDANT_CREATED',
      entityType: 'Dependant',
      entityId: String(dependant.id),
      ipAddress: ip,
      metadata: { employeeId, profileId: dependantProfile.id },
    });

    return dependant;
  }

  async updateDependant(
    employeeId: number,
    dependantId: number,
    dto: UpdateDependantDto,
    actorProfileId?: number,
    ip?: string,
  ) {
    const dependant = await this.prisma.dependant.findFirst({
      where: { id: dependantId, employeeProfileId: (await this.getEmployeeProfileId(employeeId)) },
      include: { dependantProfile: true },
    });
    if (!dependant) throw new NotFoundException('Dependant not found');

    const profileUpdate: Prisma.ProfileUpdateInput = {};
    if (dto.firstName !== undefined) profileUpdate.name = dto.firstName.trim();
    if (dto.lastName !== undefined) profileUpdate.lastName = dto.lastName?.trim() ?? null;
    if (dto.email !== undefined) profileUpdate.email = dto.email?.toLowerCase() ?? null;
    if (dto.contactNo !== undefined) profileUpdate.contactNo = dto.contactNo ?? null;
    if (dto.dateOfBirth !== undefined)
      profileUpdate.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.genderId !== undefined) profileUpdate.genderId = dto.genderId ?? null;

    await this.prisma.profile.update({
      where: { id: dependant.dependantProfileId },
      data: profileUpdate,
    });

    if (dto.relationTypeId !== undefined) {
      await this.prisma.dependant.update({
        where: { id: dependantId },
        data: { relationTypeId: dto.relationTypeId ?? null },
      });
    }

    await this.audit.log({
      actorProfileId,
      action: 'DEPENDANT_UPDATED',
      entityType: 'Dependant',
      entityId: String(dependantId),
      ipAddress: ip,
    });

    return this.prisma.dependant.findUnique({
      where: { id: dependantId },
      include: {
        dependantProfile: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            contactNo: true,
            dateOfBirth: true,
            genderId: true,
          },
        },
      },
    });
  }

  async removeDependant(
    employeeId: number,
    dependantId: number,
    actorProfileId?: number,
    ip?: string,
  ) {
    const dependant = await this.prisma.dependant.findFirst({
      where: { id: dependantId, employeeProfileId: (await this.getEmployeeProfileId(employeeId)) },
    });
    if (!dependant) throw new NotFoundException('Dependant not found');

    await this.prisma.dependant.delete({ where: { id: dependantId } });

    await this.audit.log({
      actorProfileId,
      action: 'DEPENDANT_DELETED',
      entityType: 'Dependant',
      entityId: String(dependantId),
      ipAddress: ip,
    });
  }

  private async getEmployeeProfileId(employeeId: number): Promise<number> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { profileId: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee.profileId;
  }

  private sanitizeEmployee(employee: any, maskPii: boolean) {
    const { personIdNumberEnc, personIdNumberHash, ...rest } = employee;
    const personIdNumber = personIdNumberEnc ? this.pii.decrypt(personIdNumberEnc) : null;
    return {
      ...rest,
      personIdNumber: maskPii ? this.pii.mask(personIdNumber) : personIdNumber,
    };
  }
}
