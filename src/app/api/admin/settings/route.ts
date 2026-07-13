import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const db = getServerSupabase();
  let settingsSchemaReady = true;
  let eventResult: any = await db
    .from('events')
    .select('id,title,event_date,location,access_code,court_count,max_participants,match_count,status')
    .order('event_date', { ascending: false });
  if (eventResult.error) {
    settingsSchemaReady = false;
    eventResult = await db
      .from('events')
      .select('id,title,event_date,location,access_code,court_count,max_participants,status')
      .order('event_date', { ascending: false });
  }
  const { data: events, error } = eventResult;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const selectedEventId = eventId || events?.[0]?.id || '';
  const { data: courts } = selectedEventId
    ? await db.from('courts').select('id,court_no,name').eq('event_id', selectedEventId).order('court_no', { ascending: true })
    : { data: [] as any[] };
  const { data: matches } = selectedEventId ? await db.from('matches').select('id').eq('event_id', selectedEventId) : { data: [] as any[] };

  return NextResponse.json({
    events: events || [],
    selected_event_id: selectedEventId,
    courts: courts || [],
    existing_match_count: (matches || []).length,
    settings_schema_ready: settingsSchemaReady,
  });
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const eventId = String(body.event_id || '').trim();
  const accessCode = String(body.access_code || '').trim();
  const courtCount = Number(body.court_count);
  const matchCount = Number(body.match_count || 0);
  const maxParticipants = Number(body.max_participants);
  const status = String(body.status || '').trim();

  if (!eventId) return NextResponse.json({ error: '모임을 선택하세요.' }, { status: 400 });
  if (!accessCode) return NextResponse.json({ error: '모임코드를 입력하세요.' }, { status: 400 });
  if (!Number.isInteger(courtCount) || courtCount < 1) return NextResponse.json({ error: '코트 수는 1 이상의 정수여야 합니다.' }, { status: 400 });
  if (matchCount && (!Number.isInteger(matchCount) || matchCount < 1)) return NextResponse.json({ error: '지정 경기수는 1 이상의 정수여야 합니다.' }, { status: 400 });
  if (!Number.isInteger(maxParticipants) || maxParticipants < 1) return NextResponse.json({ error: '정원은 1 이상의 정수여야 합니다.' }, { status: 400 });
  if (!['open', 'closed', 'running', 'finished'].includes(status)) return NextResponse.json({ error: '모임 상태가 올바르지 않습니다.' }, { status: 400 });

  const db = getServerSupabase();
  let settingsSchemaReady = true;
  let updateResult = await db
    .from('events')
    .update({ access_code: accessCode, court_count: courtCount, max_participants: maxParticipants, match_count: matchCount || null, status })
    .eq('id', eventId);
  if (updateResult.error) {
    settingsSchemaReady = false;
    updateResult = await db.from('events').update({ access_code: accessCode, court_count: courtCount, max_participants: maxParticipants, status }).eq('id', eventId);
  }
  const { error } = updateResult;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: existingCourts, error: courtReadError } = await db.from('courts').select('court_no').eq('event_id', eventId);
  if (courtReadError) return NextResponse.json({ error: courtReadError.message }, { status: 500 });

  const existingNos = new Set((existingCourts || []).map((court: any) => court.court_no));
  const missingCourts = Array.from({ length: courtCount }, (_, index) => index + 1)
    .filter((courtNo) => !existingNos.has(courtNo))
    .map((courtNo) => ({ event_id: eventId, court_no: courtNo, name: `${courtNo}코트` }));
  if (missingCourts.length) {
    const { error: insertError } = await db.from('courts').insert(missingCourts);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    settings_schema_ready: settingsSchemaReady,
    warning: settingsSchemaReady ? null : 'match_count 컬럼이 아직 DB에 없어 지정 경기수는 저장되지 않았습니다. db/event_settings.sql을 Supabase SQL Editor에서 실행하세요.',
  });
}
