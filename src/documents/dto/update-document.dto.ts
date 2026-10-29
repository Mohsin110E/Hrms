import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDocumentDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  documentTypeId?: number;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  identityNo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  documentTitle?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  isSelf?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
