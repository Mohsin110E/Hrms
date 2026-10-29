import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MenuPermissionItemDto } from './dto/menu-permission-item.dto';
import { MenuOverrideItemDto } from './dto/menu-override-item.dto';

export interface MenuNode {
  id: number;
  name: string;
  pageUrl?: string | null;
  iconClass?: string | null;
  displayOrder: number;
  isMainMenu: boolean;
  isActive: boolean;
  permissions?: {
    isCreate: boolean;
    isEdit: boolean;
    isDelete: boolean;
  };
  override?: {
    isInclude: boolean;
  };
  children: MenuNode[];
}

@Injectable()
export class RbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listUserTypes() {
    return this.prisma.userType.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async listRoles() {
    return this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async listMenuItems() {
    return this.prisma.menuItem.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getMenuTree() {
    const items = await this.prisma.menuItem.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return this.buildTree(items);
  }

  async getMenuPermissions(userTypeId: number) {
    const userType = await this.prisma.userType.findUnique({
      where: { id: userTypeId },
    });
    if (!userType) {
      throw new NotFoundException('User type not found');
    }

    return this.prisma.menuUserTypePermission.findMany({
      where: { userTypeId },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            pageUrl: true,
            displayOrder: true,
          },
        },
      },
    });
  }

  async setMenuPermissions(
    userTypeId: number,
    permissions: MenuPermissionItemDto[],
    actorProfileId?: number,
    ip?: string,
  ) {
    const userType = await this.prisma.userType.findUnique({
      where: { id: userTypeId },
    });
    if (!userType) {
      throw new NotFoundException('User type not found');
    }

    const menuItemIds = permissions.map((p) => p.menuItemId);
    const existingItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true },
    });
    const validIds = new Set(existingItems.map((i) => i.id));

    const invalid = menuItemIds.find((id) => !validIds.has(id));
    if (invalid !== undefined) {
      throw new NotFoundException(`Menu item ${invalid} not found`);
    }

    await this.prisma.$transaction([
      this.prisma.menuUserTypePermission.deleteMany({ where: { userTypeId } }),
      this.prisma.menuUserTypePermission.createMany({
        data: permissions.map((p) => ({
          userTypeId,
          menuItemId: p.menuItemId,
          pageUrlOverride: p.pageUrlOverride ?? null,
          isCreate: p.isCreate ?? false,
          isEdit: p.isEdit ?? false,
          isDelete: p.isDelete ?? false,
        })),
        skipDuplicates: true,
      }),
    ]);

    await this.audit.log({
      actorProfileId,
      action: 'MENU_PERMISSIONS_UPDATED',
      entityType: 'UserType',
      entityId: String(userTypeId),
      ipAddress: ip,
      metadata: { count: permissions.length },
    });

    return this.getMenuPermissions(userTypeId);
  }

  async getMenuOverrides(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.menuUserOverride.findMany({
      where: { userId },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            pageUrl: true,
            displayOrder: true,
          },
        },
      },
    });
  }

  async setMenuOverrides(
    userId: number,
    overrides: MenuOverrideItemDto[],
    actorProfileId?: number,
    ip?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const menuItemIds = overrides.map((o) => o.menuItemId);
    const existingItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true },
    });
    const validIds = new Set(existingItems.map((i) => i.id));

    const invalid = menuItemIds.find((id) => !validIds.has(id));
    if (invalid !== undefined) {
      throw new NotFoundException(`Menu item ${invalid} not found`);
    }

    await this.prisma.$transaction([
      this.prisma.menuUserOverride.deleteMany({ where: { userId } }),
      this.prisma.menuUserOverride.createMany({
        data: overrides.map((o) => ({
          userId,
          menuItemId: o.menuItemId,
          isInclude: o.isInclude,
          pageUrlOverride: o.pageUrlOverride ?? null,
        })),
        skipDuplicates: true,
      }),
    ]);

    await this.audit.log({
      actorProfileId,
      action: 'MENU_OVERRIDES_UPDATED',
      entityType: 'User',
      entityId: String(userId),
      ipAddress: ip,
      metadata: { count: overrides.length },
    });

    return this.getMenuOverrides(userId);
  }

  async getMyMenu(userId: number, userTypeId: number): Promise<MenuNode[]> {
    const [allItems, basePermissions, overrides] = await Promise.all([
      this.prisma.menuItem.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.menuUserTypePermission.findMany({
        where: { userTypeId },
      }),
      this.prisma.menuUserOverride.findMany({
        where: { userId },
      }),
    ]);

    const baseMap = new Map(basePermissions.map((p) => [p.menuItemId, p]));
    const overrideMap = new Map(overrides.map((o) => [o.menuItemId, o]));

    // Determine effective inclusion for each menu item.
    const effectiveItems = allItems
      .map((item) => {
        const base = baseMap.get(item.id);
        const override = overrideMap.get(item.id);

        let included = !!base;
        if (override) {
          included = override.isInclude;
        }

        if (!included) return null;

        return {
          ...item,
          effectivePageUrl:
            override?.pageUrlOverride ?? base?.pageUrlOverride ?? item.pageUrl,
          permissions: base
            ? {
                isCreate: base.isCreate,
                isEdit: base.isEdit,
                isDelete: base.isDelete,
              }
            : { isCreate: false, isEdit: false, isDelete: false },
          override: override ? { isInclude: override.isInclude } : undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return this.buildTreeWithExtras(effectiveItems);
  }

  private buildTree(items: any[]): MenuNode[] {
    const map = new Map<number, MenuNode>();
    const roots: MenuNode[] = [];

    for (const item of items) {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        pageUrl: item.pageUrl,
        iconClass: item.iconClass,
        displayOrder: item.displayOrder,
        isMainMenu: item.isMainMenu,
        isActive: item.isActive,
        children: [],
      });
    }

    for (const item of items) {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private buildTreeWithExtras(
    items: Array<any & { effectivePageUrl?: string; permissions?: any; override?: any }>,
  ): MenuNode[] {
    const map = new Map<number, MenuNode>();
    const roots: MenuNode[] = [];

    for (const item of items) {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        pageUrl: item.effectivePageUrl ?? item.pageUrl,
        iconClass: item.iconClass,
        displayOrder: item.displayOrder,
        isMainMenu: item.isMainMenu,
        isActive: item.isActive,
        permissions: item.permissions,
        override: item.override,
        children: [],
      });
    }

    for (const item of items) {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
