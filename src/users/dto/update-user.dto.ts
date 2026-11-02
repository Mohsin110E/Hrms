import { IsInt, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  userTypeId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
