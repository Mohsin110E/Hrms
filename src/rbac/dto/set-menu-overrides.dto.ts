import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MenuOverrideItemDto } from './menu-override-item.dto';

export class SetMenuOverridesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuOverrideItemDto)
  overrides: MenuOverrideItemDto[];
}
