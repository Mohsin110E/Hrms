import {
  IsString,
  IsOptional,
  IsInt,
  IsEmail,
  IsDateString,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  middleName?: string;

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
  maritalStatusId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  genderId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  bloodGroupId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  nationalityId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  motherTongueId?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  qualification?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  employeeCode?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  reportingToId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  sourceOfHireId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  locationId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  siteId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  employeeStatusId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  employeeTypeId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  contractTypeId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  workPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  extension?: string;

  @IsEmail()
  @IsOptional()
  workEmail?: string;

  @IsDateString()
  @IsOptional()
  dateOfJoining?: string;

  @IsDateString()
  @IsOptional()
  dateOfConfirmation?: string;

  @IsString()
  @IsOptional()
  @MinLength(14)
  personIdNumber?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  shiftId?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' || value === true || value === 1 || value === '1'
      ? true
      : value === 'false' || value === false || value === 0 || value === '0'
      ? false
      : value,
  )
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' || value === true || value === 1 || value === '1'
      ? true
      : value === 'false' || value === false || value === 0 || value === '0'
      ? false
      : value,
  )
  isSiteAccess?: boolean;

  @Type(() => Number)
  @IsInt({ each: true })
  @IsOptional()
  departmentIds?: number[];
}
