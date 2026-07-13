import { NextResponse } from 'next/server';
import { getParticipantEventSession } from '@/lib/event-session';
import { getServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const serverSupabase = getServerSupabase();
  const body = await request.json().catch(() => ({}));
  const session = await getParticipantEventSession();
  const accessCode = String(body.access_code || session?.accessCode || '').trim();
  const name = String(body.name || '').trim();
  const phoneLast4 = String(body.phone_last4 || '').trim();
  const level = String(body.level || '').trim();
  const gender = String(body.gender || '').trim();
  const playType = String(body.play_type || 'random');
  const partnerMaleName = String(body.partner_male_name || '').trim();
  const partnerFemaleName = String(body.partner_female_name || '').trim();
  const partnerName = [partnerMaleName && `남자:${partnerMaleName}`, partnerFemaleName && `여자:${partnerFemaleName}`].filter(Boolean).join(' / ');

  if (!accessCode || !name || !/^\d{4}$/.test(phoneLast4)) {
    return NextResponse.json({ error: '모임코드, 이름, 휴대폰 뒤 4자리를 확인하세요.' }, { status: 400 });
  }
  if (!['E조', 'D조', 'C조', 'B조', 'A조', 'S조'].includes(level)) {
    return NextResponse.json({ error: '급수를 선택하세요.' }, { status: 400 });
  }

  const { data: event } = await serverSupabase.from('events').select('id').eq('access_code', accessCode).in('status', ['open', 'running']).maybeSingle();
  if (!event) return NextResponse.json({ error: '참가 신청 가능한 모임을 찾을 수 없습니다.' }, { status: 404 });

  const { data: member, error: memberError } = await serverSupabase
    .from('members')
    .upsert(
      {
        name,
        gender: gender || null,
        level,
        phone_last4: phoneLast4,
        memo: String(body.memo || '').trim() || null,
      },
      { onConflict: 'name,phone_last4' },
    )
    .select('id')
    .single();
  if (memberError || !member) return NextResponse.json({ error: memberError?.message || '회원 저장 실패' }, { status: 500 });

  const { error } = await serverSupabase.from('registrations').upsert(
    {
      event_id: event.id,
      member_id: member.id,
      play_type: playType,
      partner_name: partnerName || null,
      status: 'applied',
      note: String(body.note || '').trim() || null,
    },
    { onConflict: 'event_id,member_id' },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
