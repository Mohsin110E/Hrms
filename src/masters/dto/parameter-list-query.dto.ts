import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ParameterListQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  parameterTypeId?: number;

  @IsOptional()
  @IsString()
  typeCode?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  pageSize?: number = 25;
}
