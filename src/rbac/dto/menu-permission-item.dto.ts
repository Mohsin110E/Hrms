import { IsInt, IsOptional, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MenuPermissionItemDto {
  @Type(() => Number)
  @IsInt()
  menuItemId: number;

  @IsOptional()
  @IsString()
  pageUrlOverride?: string;

  @IsOptional()
  @IsBoolean()
  isCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  isEdit?: boolean;

  @IsOptional()
  @IsBoolean()
  isDelete?: boolean;
}
