import 'server-only';
import {createHash} from 'node:crypto';

export function submissionIpHash(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip')?.trim();
  const secret = process.env.LWR_AUTH_SECRET;
  if (!ip || !secret) return null;
  return createHash('sha256').update(secret).update(':').update(ip).digest('hex');
}
export function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function jsonObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
