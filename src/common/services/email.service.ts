import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter?: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const smtpHost = this.config.get<string>('app.email.smtpHost', '');
    const smtpPort = this.config.get<number>('app.email.smtpPort', 587);
    const smtpSecure = this.config.get<boolean>('app.email.smtpSecure', false);
    const smtpUser = this.config.get<string>('app.email.smtpUser', '');
    const smtpPass = this.config.get<string>('app.email.smtpPass', '');
    this.from = this.config.get<string>('app.email.from', 'no-reply@example.com');

    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: smtpUser
          ? {
              user: smtpUser,
              pass: smtpPass,
            }
          : undefined,
      });
    }
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('SMTP not configured; email would be sent:', {
        to: message.to,
        subject: message.subject,
      });
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      this.logger.log(`Email sent to ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`);
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw error;
    }
  }
}
