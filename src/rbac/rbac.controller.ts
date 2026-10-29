import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Ip,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { SetMenuPermissionsDto } from './dto/set-menu-permissions.dto';
import { SetMenuOverridesDto } from './dto/set-menu-overrides.dto';

@ApiTags('RBAC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('user-types')
  async userTypes() {
    const items = await this.rbacService.listUserTypes();
    return { data: items, message: { code: 'OK', text: 'User types retrieved' } };
  }

  @Get('roles')
  async roles() {
    const items = await this.rbacService.listRoles();
    return { data: items, message: { code: 'OK', text: 'Roles retrieved' } };
  }

  @Get('menu-items')
  async menuItems() {
    const items = await this.rbacService.listMenuItems();
    return { data: items, message: { code: 'OK', text: 'Menu items retrieved' } };
  }

  @Get('menu-items/tree')
  async menuTree() {
    const tree = await this.rbacService.getMenuTree();
    return { data: tree, message: { code: 'OK', text: 'Menu tree retrieved' } };
  }

  @Get('menu-permissions/:userTypeId')
  async menuPermissions(@Param('userTypeId', ParseIntPipe) userTypeId: number) {
    const items = await this.rbacService.getMenuPermissions(userTypeId);
    return {
      data: items,
      message: { code: 'OK', text: 'Menu permissions retrieved' },
    };
  }

  @Put('menu-permissions/:userTypeId')
  async setMenuPermissions(
    @Param('userTypeId', ParseIntPipe) userTypeId: number,
    @Body() dto: SetMenuPermissionsDto,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    const items = await this.rbacService.setMenuPermissions(
      userTypeId,
      dto.permissions,
      user.profileId,
      ip,
    );
    return {
      data: items,
      message: { code: 'OK', text: 'Menu permissions updated' },
    };
  }

  @Get('menu-overrides/:userId')
  async menuOverrides(@Param('userId', ParseIntPipe) userId: number) {
    const items = await this.rbacService.getMenuOverrides(userId);
    return {
      data: items,
      message: { code: 'OK', text: 'Menu overrides retrieved' },
    };
  }

  @Put('menu-overrides/:userId')
  async setMenuOverrides(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: SetMenuOverridesDto,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    const items = await this.rbacService.setMenuOverrides(
      userId,
      dto.overrides,
      user.profileId,
      ip,
    );
    return {
      data: items,
      message: { code: 'OK', text: 'Menu overrides updated' },
    };
  }

  @Get('my-menu')
  async myMenu(@CurrentUser() user: CurrentUserPayload) {
    const tree = await this.rbacService.getMyMenu(user.userId, user.userTypeId);
    return {
      data: tree,
      message: { code: 'OK', text: 'My menu retrieved' },
    };
  }
}
