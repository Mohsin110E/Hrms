import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateLanguageDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
