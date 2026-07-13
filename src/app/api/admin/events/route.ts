import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase/server';

async function requireAdmin() {
  return isAdminRequest();
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const db = getServerSupabase();
  const { data: events, error } = await db
    .from('events')
    .select('id,title,event_date,location,start_time,end_time,access_code,max_participants,court_count,status,created_at')
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const eventIds = (events || []).map((event) => event.id);
  const { data: registrations } = eventIds.length
    ? await db.from('registrations').select('event_id,status').in('event_id', eventIds)
    : { data: [] as any[] };
  const { data: matches } = eventIds.length
    ? await db.from('matches').select('event_id,status').in('event_id', eventIds)
    : { data: [] as any[] };

  const rows = (events || []).map((event) => {
    const eventRegistrations = (registrations || []).filter((row: any) => row.event_id === event.id);
    const eventMatches = (matches || []).filter((row: any) => row.event_id === event.id);
    return {
      ...event,
      registration_count: eventRegistrations.length,
      checked_in_count: eventRegistrations.filter((row: any) => row.status === 'checked_in').length,
      match_count: eventMatches.length,
      finished_match_count: eventMatches.filter((row: any) => row.status === 'finished').length,
    };
  });

  return NextResponse.json({ events: rows });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const serverSupabase = getServerSupabase();
  const body = await request.json().catch(() => ({}));
  const title = String(body.title || '').trim();
  const eventDate = String(body.event_date || '');
  const accessCode = String(body.access_code || '').trim();
  const courtCount = Number(body.court_count);
  const maxParticipants = Number(body.max_participants);

  if (!title || !eventDate || !accessCode) {
    return NextResponse.json({ error: '모임명, 날짜, 모임 코드는 필수입니다.' }, { status: 400 });
  }
  if (!Number.isInteger(courtCount) || courtCount < 1 || !Number.isInteger(maxParticipants) || maxParticipants < 1) {
    return NextResponse.json({ error: '정원과 코트 수는 1 이상의 정수여야 합니다.' }, { status: 400 });
  }

  const { data: event, error } = await serverSupabase
    .from('events')
    .insert({
      title,
      event_date: eventDate,
      location: String(body.location || '').trim() || null,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      access_code: accessCode,
      max_participants: maxParticipants,
      court_count: courtCount,
      status: 'open',
    })
    .select('id')
    .single();

  if (error || !event) return NextResponse.json({ error: error?.message || '모임 생성 실패' }, { status: 500 });

  const courts = Array.from({ length: courtCount }, (_, i) => ({ event_id: event.id, court_no: i + 1, name: `${i + 1}코트` }));
  const { error: courtError } = await serverSupabase.from('courts').insert(courts);
  if (courtError) {
    await serverSupabase.from('events').delete().eq('id', event.id);
    return NextResponse.json({ error: courtError.message }, { status: 500 });
  }

  return NextResponse.json({ id: event.id }, { status: 201 });
}
