import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Masters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('masters')
export class MastersController {
  @Get('departments')
  departments() {
    return { message: { code: 'OK', text: 'Departments not yet implemented' } };
  }

  @Get('sites')
  sites() {
    return { message: { code: 'OK', text: 'Sites not yet implemented' } };
  }

  @Get('shifts')
  shifts() {
    return { message: { code: 'OK', text: 'Shifts not yet implemented' } };
  }

  @Get('document-types')
  documentTypes() {
    return { message: { code: 'OK', text: 'Document types not yet implemented' } };
  }

  @Get('parameters')
  parameters() {
    return { message: { code: 'OK', text: 'Parameters not yet implemented' } };
  }

  @Get('form-definitions')
  formDefinitions() {
    return { message: { code: 'OK', text: 'Form definitions not yet implemented' } };
  }
}
