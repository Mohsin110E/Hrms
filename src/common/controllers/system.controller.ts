import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('System')
@Controller('messages')
export class MessagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query('typeId') typeId?: string) {
    const where = typeId ? { messageTypeId: parseInt(typeId, 10) } : {};
    const items = await this.prisma.message.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });
    return { data: items, message: { code: 'OK', text: 'Messages retrieved' } };
  }
}

@ApiTags('System')
@Controller('system-configurations')
export class SystemConfigurationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    const items = await this.prisma.systemConfiguration.findMany({
      orderBy: { id: 'asc' },
    });
    return {
      data: items,
      message: { code: 'OK', text: 'System configurations retrieved' },
    };
  }
}
