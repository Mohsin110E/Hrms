import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  @Get()
  findAll(@Query() _query: any) {
    return { message: { code: 'OK', text: 'Documents list not yet implemented' } };
  }

  @Post()
  create(@Body() _dto: any) {
    return { message: { code: 'OK', text: 'Document creation not yet implemented' } };
  }

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return { message: { code: 'OK', text: 'Document detail not yet implemented' } };
  }

  @Patch(':id')
  update(@Param('id') _id: string, @Body() _dto: any) {
    return { message: { code: 'OK', text: 'Document update not yet implemented' } };
  }

  @Delete(':id')
  remove(@Param('id') _id: string) {
    return { message: { code: 'OK', text: 'Document deletion not yet implemented' } };
  }

  @Get(':id/files/:fileId/download')
  download(@Param('id') _id: string, @Param('fileId') _fileId: string) {
    return { message: { code: 'OK', text: 'Download not yet implemented' } };
  }
}
