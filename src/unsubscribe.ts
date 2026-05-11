import 'dotenv/config';
import { createHmac, timingSafeEqual } from 'crypto';

const SECRET    = process.env.UNSUBSCRIBE_SECRET ?? '';
const BASE_URL  = (process.env.PUBLIC_URL ?? 'https://ia.anthonycazares.cafe').replace(/\/$/, '');

function sign(email: string): string {
  if (!SECRET) throw new Error('UNSUBSCRIBE_SECRET no configurado');
  return createHmac('sha256', SECRET).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

export function unsubscribeUrl(email: string): string {
  const token = sign(email);
  const e     = encodeURIComponent(email.toLowerCase());
  return `${BASE_URL}/unsubscribe?e=${e}&t=${token}`;
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  try {
    const expected = Buffer.from(sign(email), 'hex');
    const got      = Buffer.from(token, 'hex');
    if (expected.length !== got.length) return false;
    return timingSafeEqual(expected, got);
  } catch {
    return false;
  }
}
