import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Ip,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { UploadedFileLike } from '../common/services/file-storage.service';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  private okEnvelope(data: any, text: string, pagination?: any) {
    return { data, message: { code: 'OK', text }, pagination };
  }

  @Get()
  async findAll(@Query() query: ListDocumentsQueryDto) {
    const result = await this.documentsService.findAll(query);
    return this.okEnvelope(result.items, 'Documents retrieved', result.pagination);
  }

  @Post()
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    const created = await this.documentsService.create(dto, user.profileId, ip);
    return this.okEnvelope(created, 'Document created');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const item = await this.documentsService.findOne(id);
    return this.okEnvelope(item, 'Document retrieved');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.documentsService.update(id, dto, user.profileId, ip);
    return this.okEnvelope(updated, 'Document updated');
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.documentsService.remove(id, user.profileId, ip);
    return this.okEnvelope(updated, 'Document deactivated');
  }

  @Post(':id/files')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async attachFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: UploadedFileLike,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    if (!file) {
      return this.okEnvelope(null, 'No file uploaded');
    }
    const result = await this.documentsService.attachFile(id, file, user.profileId, ip);
    return this.okEnvelope(result, 'File attached');
  }

  @Get(':id/files/:fileId/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @Res() res: Response,
  ) {
    const { stream, fileName, mimeType, sizeBytes } = await this.documentsService.getFileStream(
      id,
      fileId,
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    if (mimeType) res.setHeader('Content-Type', mimeType);
    if (sizeBytes !== null && sizeBytes !== undefined) {
      res.setHeader('Content-Length', sizeBytes.toString());
    }
    stream.pipe(res);
  }

  @Delete(':id/files/:fileId')
  async markFileNonCurrent(
    @Param('id', ParseIntPipe) id: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    await this.documentsService.markFileNonCurrent(id, fileId, user.profileId, ip);
    return this.okEnvelope(null, 'File marked as non-current');
  }

  @Get('expiring')
  async expiring(@Query('days') days: string) {
    const daysNum = parseInt(days ?? '30', 10);
    const items = await this.documentsService.findExpiring(daysNum);
    return this.okEnvelope(items, 'Expiring documents retrieved');
  }

  @Get('expired')
  async expired() {
    const items = await this.documentsService.findExpired();
    return this.okEnvelope(items, 'Expired documents retrieved');
  }

  @Post('scheduler/run')
  @HttpCode(HttpStatus.OK)
  async runScheduler(@CurrentUser() user: CurrentUserPayload, @Ip() ip: string) {
    const result = await this.documentsService.runExpiryAlerts(user.profileId, ip);
    return this.okEnvelope(result, 'Expiry scheduler run completed');
  }
}
