import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

export interface PaginatedUsers {
  items: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

@Injectable()
export class UsersService {
  private readonly bcryptRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {
    this.bcryptRounds = this.config.get<number>('app.security.bcryptRounds', 12);
  }

  async findAll(query: ListUsersQueryDto): Promise<PaginatedUsers> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = [25, 50, 100].includes(query.pageSize ?? 25)
      ? query.pageSize ?? 25
      : 25;
    const skip = (page - 1) * pageSize;

    const allowedSortFields = ['username', 'createdAt', 'userTypeId', 'isActive'];
    const sortBy =
      query.sortBy && allowedSortFields.includes(query.sortBy)
        ? query.sortBy
        : 'username';
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    const where: any = {};
    if (query.userTypeId !== undefined) {
      where.userTypeId = query.userTypeId;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.search) {
      const term = query.search.trim().toLowerCase();
      where.profile = {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      };
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          profile: {
            select: {
              id: true,
              name: true,
              lastName: true,
              email: true,
              contactNo: true,
              isSiteAccess: true,
            },
          },
          userType: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const sanitizedItems = items.map((u) => this.sanitizeUser(u));

    return {
      items: sanitizedItems,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        totalItems,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
            statusId: true,
            dateOfBirth: true,
          },
        },
        userType: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async create(dto: CreateUserDto, actorProfileId?: number, ip?: string) {
    const normalizedUsername = dto.username.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    let profileId = dto.profileId;

    if (profileId) {
      const profile = await this.prisma.profile.findUnique({
        where: { id: profileId },
      });
      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      const existingUserForProfile = await this.prisma.user.findUnique({
        where: { profileId },
      });
      if (existingUserForProfile) {
        throw new ConflictException('A user already exists for this profile');
      }
    } else {
      if (!dto.firstName || !dto.email) {
        throw new BadRequestException('firstName and email are required when profileId is not provided');
      }

      const emailTaken = await this.prisma.profile.findFirst({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailTaken) {
        throw new ConflictException('Email already exists');
      }

      const profile = await this.prisma.profile.create({
        data: {
          name: dto.firstName.trim(),
          lastName: dto.lastName?.trim() ?? null,
          email: dto.email.toLowerCase(),
          isSiteAccess: true,
        },
      });
      profileId = profile.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);

    const user = await this.prisma.user.create({
      data: {
        username: normalizedUsername,
        passwordHash,
        userTypeId: dto.userTypeId,
        profileId,
        mustChangePassword: false,
        isActive: true,
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            contactNo: true,
            isSiteAccess: true,
          },
        },
        userType: {
          select: { id: true, name: true },
        },
      },
    });

    await this.audit.log({
      actorProfileId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: String(user.id),
      ipAddress: ip,
      metadata: { userTypeId: dto.userTypeId, profileId },
    });

    return this.sanitizeUser(user);
  }

  async update(id: number, dto: UpdateUserDto, actorProfileId?: number, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.userTypeId !== undefined && { userTypeId: dto.userTypeId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            contactNo: true,
            isSiteAccess: true,
          },
        },
        userType: {
          select: { id: true, name: true },
        },
      },
    });

    await this.audit.log({
      actorProfileId,
      action: dto.isActive === false ? 'USER_DEACTIVATED' : 'USER_UPDATED',
      entityType: 'User',
      entityId: String(id),
      ipAddress: ip,
      metadata: { changes: { ...dto } },
    });

    return this.sanitizeUser(updated);
  }

  async remove(id: number, actorProfileId?: number, ip?: string) {
    return this.update(id, { isActive: false }, actorProfileId, ip);
  }

  async resetPassword(
    id: number,
    newPassword: string,
    actorProfileId?: number,
    ip?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.bcryptRounds);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        legacyPasswordEnc: null,
        mustChangePassword: true,
      },
    });

    await this.prisma.userActivity.upsert({
      where: { userId: id },
      create: {
        userId: id,
        passwordChangedAt: new Date(),
        isPasswordReset: true,
      },
      update: {
        passwordChangedAt: new Date(),
        isPasswordReset: true,
      },
    });

    await this.audit.log({
      actorProfileId,
      action: 'ADMIN_PASSWORD_RESET',
      entityType: 'User',
      entityId: String(id),
      ipAddress: ip,
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, legacyPasswordEnc, ...rest } = user;
    return rest;
  }
}
