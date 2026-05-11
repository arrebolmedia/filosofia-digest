import 'dotenv/config';

export const CONFIG = {
  anthropicKey:   process.env.ANTHROPIC_API_KEY!,
  resendKey:      process.env.RESEND_API_KEY,
  smtpHost:       process.env.SMTP_HOST,
  smtpPort:       parseInt(process.env.SMTP_PORT ?? '587'),
  smtpUser:       process.env.SMTP_USER,
  smtpPass:       process.env.SMTP_PASS,
  senderEmail:    process.env.SENDER_EMAIL ?? process.env.SMTP_USER ?? 'digest@localhost',
  recipientEmail: process.env.RECIPIENT_EMAIL ?? 'anthony@arrebol.com.mx',
  maxPdfItems: 3,
  model: 'claude-sonnet-4-6' as const,
} as const;

export type PhilosophyTheme = string;
