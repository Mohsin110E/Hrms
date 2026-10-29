import { Injectable } from '@nestjs/common';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  async send(message: EmailMessage): Promise<void> {
    // TODO: integrate with the organization's SMTP/transactional email provider.
    // For local development the message is logged instead of sent.
    console.log('[EmailService] Would send email:', {
      to: message.to,
      subject: message.subject,
    });
  }
}
