import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  async sendVerificationEmail(name: string, email: string, token: string) {
    const subject = 'Bem-vindo ao Daily Radio! Confirme seu E-mail';
    const html = `
      <p>Olá ${name},</p>
      <p>Por favor, clique no link a seguir para verificar seu e-mail: 
      <a href="${this.frontendUrl}/auth/verify-email?token=${token}">${this.frontendUrl}/auth/verify-email?token=${token}</a></p>
      <p>Este link expirará em 1 hora.</p>`;

    return this.sendEmail(email, subject, html);
  }

  async sendNewVerificationLink(name: string, email: string, token: string) {
    const subject = 'Daily Radio - Novo Link de Verificação';
    const html = `
      <p>Olá ${name},</p>
      <p>Aqui está seu novo link para verificar seu e-mail: 
      <a href="${this.frontendUrl}/auth/verify-email?token=${token}">${this.frontendUrl}/auth/verify-email?token=${token}</a></p>
      <p>Este link expirará em 1 hora.</p>`;

    return this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.resend.emails.send({
        from: 'Daily Radio <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${to}:`, error);
      throw new InternalServerErrorException(
        'Não foi possível enviar o e-mail de verificação.',
      );
    }
  }
}
