import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'startTime must be in HH:mm or HH:mm:ss format',
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'endTime must be in HH:mm or HH:mm:ss format',
  })
  endTime?: string;

  @IsOptional()
  @IsInt()
  lateMinutes?: number;

  @IsOptional()
  @IsInt()
  halfDayMinutes?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'altStartTime must be in HH:mm or HH:mm:ss format',
  })
  altStartTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'altEndTime must be in HH:mm or HH:mm:ss format',
  })
  altEndTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
