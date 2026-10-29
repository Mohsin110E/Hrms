import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
