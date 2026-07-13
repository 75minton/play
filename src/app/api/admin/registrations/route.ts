import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id') || '';
  const db = getServerSupabase();
  const { data: events, error: eventError } = await db.from('events').select('id,title,event_date,location').order('event_date', { ascending: false });
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  const selectedEventId = eventId || events?.[0]?.id || '';
  const { data, error } = selectedEventId
    ? await db
        .from('registrations')
        .select('id,status,play_type,partner_name,note,member_id,members(id,name,gender,level,phone_last4,memo),events(title,event_date)')
        .eq('event_id', selectedEventId)
        .order('created_at', { ascending: true })
    : { data: [] as any[], error: null };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: events || [], selected_event_id: selectedEventId, registrations: data || [] });
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const registrationId = String(body.registration_id || '').trim();
  const memberId = String(body.member_id || '').trim();
  const name = String(body.name || '').trim();
  const gender = String(body.gender || '').trim();
  const level = String(body.level || '').trim();
  const phoneLast4 = String(body.phone_last4 || '').trim();
  const playType = String(body.play_type || 'random');
  const partnerName = String(body.partner_name || '').trim();
  const status = String(body.status || 'applied');
  const memo = String(body.memo || '').trim();

  if (!registrationId || !memberId || !name || !/^\d{4}$/.test(phoneLast4)) {
    return NextResponse.json({ error: '참가자 정보가 올바르지 않습니다.' }, { status: 400 });
  }
  if (!['E조', 'D조', 'C조', 'B조', 'A조', 'S조'].includes(level)) {
    return NextResponse.json({ error: '급수를 선택하세요.' }, { status: 400 });
  }

  const db = getServerSupabase();
  const { error: memberError } = await db.from('members').update({ name, gender, level, phone_last4: phoneLast4, memo: memo || null }).eq('id', memberId);
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

  const { error: regError } = await db.from('registrations').update({ play_type: playType, partner_name: partnerName || null, status }).eq('id', registrationId);
  if (regError) return NextResponse.json({ error: regError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
