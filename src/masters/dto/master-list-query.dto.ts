import { IsOptional, IsInt, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class MasterListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  pageSize?: number = 25;

  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
