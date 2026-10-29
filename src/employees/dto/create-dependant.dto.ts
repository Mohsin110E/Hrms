import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEmail,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDependantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  contactNo?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  relationTypeId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  genderId?: number;
}
