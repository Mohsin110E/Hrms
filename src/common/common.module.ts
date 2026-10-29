import { Global, Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { PiiService } from './services/pii.service';
import { FileStorageService } from './services/file-storage.service';
import { EmailService } from './services/email.service';
import { MessagesController, SystemConfigurationsController } from './controllers/system.controller';

@Global()
@Module({
  controllers: [MessagesController, SystemConfigurationsController],
  providers: [AuditService, PiiService, FileStorageService, EmailService],
  exports: [AuditService, PiiService, FileStorageService, EmailService],
})
export class CommonModule {}
