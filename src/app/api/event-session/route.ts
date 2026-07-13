import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  PARTICIPANT_EVENT_COOKIE,
  encodeParticipantEventSession,
  getParticipantEventSession,
} from '@/lib/event-session';

export async function GET() {
  const session = await getParticipantEventSession();
  return NextResponse.json({ authenticated: Boolean(session), event: session });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const accessCode = String(body.access_code || '').trim();
  if (!accessCode) {
    return NextResponse.json({ error: '모임코드를 입력하세요.' }, { status: 400 });
  }

  const { data: event, error } = await getServerSupabase()
    .from('events')
    .select('id,title,event_date,location,access_code,status')
    .eq('access_code', accessCode)
    .in('status', ['open', 'closed', 'running'])
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: '해당 모임코드의 모임을 찾을 수 없습니다.' }, { status: 404 });

  const session = {
    eventId: event.id,
    title: event.title,
    accessCode: event.access_code,
    eventDate: event.event_date,
    location: event.location,
  };
  (await cookies()).set(PARTICIPANT_EVENT_COOKIE, encodeParticipantEventSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true, event: session });
}

export async function DELETE() {
  (await cookies()).delete(PARTICIPANT_EVENT_COOKIE);
  return NextResponse.json({ ok: true });
}
