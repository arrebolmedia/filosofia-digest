import { CONFIG } from './config.js';

export interface MailPayload {
  subject: string;
  html:    string;
  to?:     string;
}

async function sendViaResend(payload: MailPayload): Promise<void> {
  const { Resend } = await import('resend');
  const resend = new Resend(CONFIG.resendKey!);
  const { error, data } = await resend.emails.send({
    from:    CONFIG.senderEmail,
    to:      payload.to ?? CONFIG.recipientEmail,
    subject: payload.subject,
    html:    payload.html,
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  console.log(`[mailer] Sent via Resend. ID: ${data?.id}`);
}

async function sendViaSMTP(payload: MailPayload): Promise<void> {
  const nodemailer = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host:   CONFIG.smtpHost!,
    port:   CONFIG.smtpPort,
    secure: CONFIG.smtpPort === 465,
    auth: {
      user: CONFIG.smtpUser!,
      pass: CONFIG.smtpPass!,
    },
  });
  const info = await transport.sendMail({
    from:    CONFIG.senderEmail,
    to:      payload.to ?? CONFIG.recipientEmail,
    subject: payload.subject,
    html:    payload.html,
  });
  console.log(`[mailer] Sent via SMTP. Message ID: ${info.messageId}`);
}

export async function sendDigest(payload: MailPayload): Promise<void> {
  if (CONFIG.resendKey) {
    return sendViaResend(payload);
  }
  if (CONFIG.smtpHost && CONFIG.smtpUser && CONFIG.smtpPass) {
    return sendViaSMTP(payload);
  }
  throw new Error(
    'No email transport configured. Set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS in .env',
  );
}
