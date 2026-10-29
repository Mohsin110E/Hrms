import { IsInt, IsOptional, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MenuOverrideItemDto {
  @Type(() => Number)
  @IsInt()
  menuItemId: number;

  @IsBoolean()
  isInclude: boolean;

  @IsOptional()
  @IsString()
  pageUrlOverride?: string;
}
