import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('RBAC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rbac')
export class RbacController {
  @Get('user-types')
  userTypes() {
    return { message: { code: 'OK', text: 'User types not yet implemented' } };
  }

  @Get('roles')
  roles() {
    return { message: { code: 'OK', text: 'Roles not yet implemented' } };
  }

  @Get('menu-items')
  menuItems() {
    return { message: { code: 'OK', text: 'Menu items not yet implemented' } };
  }

  @Get('menu-permissions/:userTypeId')
  menuPermissions(@Param('userTypeId') _userTypeId: string) {
    return { message: { code: 'OK', text: 'Menu permissions not yet implemented' } };
  }

  @Get('my-menu')
  myMenu() {
    return { message: { code: 'OK', text: 'My menu not yet implemented' } };
  }
}
