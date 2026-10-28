import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  @Get()
  findAll(@Query() _query: any) {
    return { message: { code: 'OK', text: 'Employees list not yet implemented' } };
  }

  @Post()
  create(@Body() _dto: any) {
    return { message: { code: 'OK', text: 'Employee creation not yet implemented' } };
  }

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return { message: { code: 'OK', text: 'Employee detail not yet implemented' } };
  }

  @Patch(':id')
  update(@Param('id') _id: string, @Body() _dto: any) {
    return { message: { code: 'OK', text: 'Employee update not yet implemented' } };
  }

  @Delete(':id')
  remove(@Param('id') _id: string) {
    return { message: { code: 'OK', text: 'Employee deletion not yet implemented' } };
  }
}
