import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @Type(() => Number)
  @IsInt()
  profileId: number;

  @Type(() => Number)
  @IsInt()
  documentTypeId: number;

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
}
