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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { CreateDependantDto } from './dto/create-dependant.dto';
import { UpdateDependantDto } from './dto/update-dependant.dto';
import { UploadedFileLike } from '../common/services/file-storage.service';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  private okEnvelope(data: any, text: string, pagination?: any) {
    return { data, message: { code: 'OK', text }, pagination };
  }

  @Get()
  async findAll(@Query() query: ListEmployeesQueryDto) {
    const result = await this.employeesService.findAll(query);
    return this.okEnvelope(result.items, 'Employees retrieved', result.pagination);
  }

  @Post()
  async create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    const created = await this.employeesService.create(dto, user.profileId, ip);
    return this.okEnvelope(created, 'Employee created');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const item = await this.employeesService.findOne(id);
    return this.okEnvelope(item, 'Employee retrieved');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.employeesService.update(id, dto, user.profileId, ip);
    return this.okEnvelope(updated, 'Employee updated');
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.employeesService.remove(id, user.profileId, ip);
    return this.okEnvelope(updated, 'Employee deactivated');
  }

  @Post(':id/photo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: UploadedFileLike,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    if (!file) {
      return this.okEnvelope(null, 'No file uploaded');
    }
    const result = await this.employeesService.uploadPhoto(id, file, user.profileId, ip);
    return this.okEnvelope(result, 'Photo uploaded');
  }

  @Get(':id/dependants')
  async findDependants(@Param('id', ParseIntPipe) id: number) {
    const items = await this.employeesService.findDependants(id);
    return this.okEnvelope(items, 'Dependants retrieved');
  }

  @Post(':id/dependants')
  async createDependant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDependantDto,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    const created = await this.employeesService.createDependant(id, dto, user.profileId, ip);
    return this.okEnvelope(created, 'Dependant created');
  }

  @Get(':id/dependants/:dependantId')
  async findOneDependant(
    @Param('id', ParseIntPipe) _employeeId: number,
    @Param('dependantId', ParseIntPipe) dependantId: number,
  ) {
    // Service method not exposed; reuse list or add later.
    return this.okEnvelope({ id: dependantId }, 'Dependant detail not yet implemented');
  }

  @Patch(':id/dependants/:dependantId')
  async updateDependant(
    @Param('id', ParseIntPipe) id: number,
    @Param('dependantId', ParseIntPipe) dependantId: number,
    @Body() dto: UpdateDependantDto,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.employeesService.updateDependant(id, dependantId, dto, user.profileId, ip);
    return this.okEnvelope(updated, 'Dependant updated');
  }

  @Delete(':id/dependants/:dependantId')
  async removeDependant(
    @Param('id', ParseIntPipe) id: number,
    @Param('dependantId', ParseIntPipe) dependantId: number,
    @CurrentUser() user: CurrentUserPayload,
    @Ip() ip: string,
  ) {
    await this.employeesService.removeDependant(id, dependantId, user.profileId, ip);
    return this.okEnvelope(null, 'Dependant deleted');
  }
}
