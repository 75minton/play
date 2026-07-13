import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = '75rabbit_admin';
export type AdminSession = { id: string; username: string; mustChangePassword: boolean; expires: number };

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('ADMIN_SESSION_SECRET은 32자 이상이어야 합니다.');
  return value;
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

export function createAdminToken(session: Omit<AdminSession, 'expires'>) {
  const payload: AdminSession = { ...session, expires: Date.now() + 1000 * 60 * 60 * 24 * 7 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const [encoded, supplied] = token.split('.');
  if (!encoded || !supplied) return null;
  const expected = sign(encoded);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as AdminSession;
    return session.expires > Date.now() ? session : null;
  } catch { return null; }
}

export async function isAdminRequest() {
  return Boolean(await getAdminSession());
}
