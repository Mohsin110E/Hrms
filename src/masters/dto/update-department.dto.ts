import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
