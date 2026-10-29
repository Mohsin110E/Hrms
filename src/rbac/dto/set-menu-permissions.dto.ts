import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MenuPermissionItemDto } from './menu-permission-item.dto';

export class SetMenuPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuPermissionItemDto)
  permissions: MenuPermissionItemDto[];
}
