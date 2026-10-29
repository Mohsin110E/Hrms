import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateShiftDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'startTime must be in HH:mm or HH:mm:ss format',
  })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'endTime must be in HH:mm or HH:mm:ss format',
  })
  endTime: string;

  @IsInt()
  lateMinutes: number;

  @IsInt()
  halfDayMinutes: number;

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
