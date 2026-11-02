import {
  IsInt,
  IsOptional,
  IsBoolean,
  IsString,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  userTypeId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Profile fields
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  contactNo?: string;

  @IsOptional()
  @IsBoolean()
  isSiteAccess?: boolean;
}
