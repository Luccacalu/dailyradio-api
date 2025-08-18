import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async sendVerificationEmail(name: string, email: string, token: string) {
    const verificationUrl = `http://localhost:3000/auth/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: 'Daily Radio <onboarding@resend.dev>',
        to: email,
        subject: 'Bem-vindo ao Daily Radio! Confirme seu E-mail',
        html: `<p>Olá ${name},</p><p>Por favor, clique no link a seguir para verificar seu e-mail: <a href="${verificationUrl}">${verificationUrl}</a></p><p>Este link expirará em 1 hora.</p>`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send verification email.');
    }
  }

  async sendNewVerificationLink(name: string, email: string, token: string) {
    const verificationUrl = `http://localhost:3000/auth/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: 'Daily Radio <onboarding@resend.dev>',
        to: email,
        subject: 'Daily Radio - Novo Link de Verificação',
        html: `<p>Olá ${name},</p><p>Aqui está seu novo link para verificar seu e-mail: <a href="${verificationUrl}">${verificationUrl}</a></p><p>Este link expirará em 1 hora.</p>`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send new verification email.');
    }
  }
}
