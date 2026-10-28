import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  @Get()
  findAll(@Query() _query: any) {
    return { message: { code: 'OK', text: 'Users list not yet implemented' } };
  }

  @Post()
  create(@Body() _dto: any) {
    return { message: { code: 'OK', text: 'User creation not yet implemented' } };
  }

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return { message: { code: 'OK', text: 'User detail not yet implemented' } };
  }

  @Patch(':id')
  update(@Param('id') _id: string, @Body() _dto: any) {
    return { message: { code: 'OK', text: 'User update not yet implemented' } };
  }

  @Delete(':id')
  remove(@Param('id') _id: string) {
    return { message: { code: 'OK', text: 'User deletion not yet implemented' } };
  }
}
