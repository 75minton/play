import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const PARTICIPANT_EVENT_COOKIE = '75rabbit_event';

export type ParticipantEventSession = {
  eventId: string;
  title: string;
  eventDate: string;
  location: string | null;
};

function sessionSecret() {
  const value = process.env.EVENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('EVENT_SESSION_SECRET 또는 ADMIN_SESSION_SECRET은 32자 이상이어야 합니다.');
  return value;
}

function sign(value: string) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function encodeParticipantEventSession(session: ParticipantEventSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function decodeParticipantEventSession(value: string): ParticipantEventSession | null {
  try {
    const [payload, suppliedSignature] = value.split('.');
    if (!payload || !suppliedSignature) return null;
    const expectedSignature = sign(payload);
    const supplied = Buffer.from(suppliedSignature);
    const expected = Buffer.from(expectedSignature);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as ParticipantEventSession;
    if (!parsed.eventId || !parsed.title || !parsed.eventDate) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getParticipantEventSession() {
  const value = (await cookies()).get(PARTICIPANT_EVENT_COOKIE)?.value;
  return value ? decodeParticipantEventSession(value) : null;
}
