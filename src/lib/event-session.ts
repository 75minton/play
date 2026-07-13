import 'server-only';
import { cookies } from 'next/headers';

export const PARTICIPANT_EVENT_COOKIE = '75rabbit_event';

export type ParticipantEventSession = {
  eventId: string;
  title: string;
  accessCode: string;
  eventDate: string;
  location: string | null;
};

export function encodeParticipantEventSession(session: ParticipantEventSession) {
  return Buffer.from(JSON.stringify(session)).toString('base64url');
}

export function decodeParticipantEventSession(value: string): ParticipantEventSession | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString()) as ParticipantEventSession;
    if (!parsed.eventId || !parsed.accessCode || !parsed.title) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getParticipantEventSession() {
  const value = (await cookies()).get(PARTICIPANT_EVENT_COOKIE)?.value;
  return value ? decodeParticipantEventSession(value) : null;
}
