import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { generateSimpleDoublesMatches } from '@/lib/matchmaker';

function toMatchView(match: any) {
  const players = match.match_players || [];
  const teamA = players
    .filter((player: any) => player.team === 'A')
    .sort((a: any, b: any) => a.position_no - b.position_no)
    .map((player: any) => player.members?.name)
    .filter(Boolean);
  const teamB = players
    .filter((player: any) => player.team === 'B')
    .sort((a: any, b: any) => a.position_no - b.position_no)
    .map((player: any) => player.members?.name)
    .filter(Boolean);

  return {
    id: match.id,
    event_id: match.event_id,
    round_no: match.round_no,
    match_no: match.match_no,
    status: match.status,
    court_no: match.courts?.court_no ?? null,
    court_name: match.courts?.name ?? null,
    team_a_score: match.team_a_score,
    team_b_score: match.team_b_score,
    winner_team: match.winner_team,
    team_a_names: teamA,
    team_b_names: teamB,
  };
}

export async function GET(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const db = getServerSupabase();

  let eventResult: any = await db
    .from('events')
    .select('id,title,event_date,location,court_count,match_count,status')
    .order('event_date', { ascending: false });
  if (eventResult.error) {
    eventResult = await db.from('events').select('id,title,event_date,location,court_count,status').order('event_date', { ascending: false });
  }
  const { data: events, error: eventError } = eventResult;
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  const selectedEventId = eventId || events?.[0]?.id || '';
  const { data: registrations } = selectedEventId
    ? await db
        .from('registrations')
        .select('id,status,members(id,name,gender,level)')
        .eq('event_id', selectedEventId)
        .in('status', ['applied', 'checked_in'])
    : { data: [] as any[] };

  const { data: matches, error: matchError } = selectedEventId
    ? await db
        .from('matches')
        .select('id,event_id,round_no,match_no,status,team_a_score,team_b_score,winner_team,courts(court_no,name),match_players(team,position_no,members(name))')
        .eq('event_id', selectedEventId)
        .order('round_no', { ascending: true })
        .order('match_no', { ascending: true })
    : { data: [] as any[], error: null };
  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });

  return NextResponse.json({
    events: events || [],
    selected_event_id: selectedEventId,
    eligible_player_count: (registrations || []).filter((row: any) => row.members?.id).length,
    matches: (matches || []).map(toMatchView),
  });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const eventId = String(body.event_id || '').trim();
  const roundNo = Number(body.round_no || 1);
  const matchCount = Number(body.match_count || 0);
  const replaceExisting = Boolean(body.replace_existing);

  if (!eventId || !Number.isInteger(roundNo) || roundNo < 1) {
    return NextResponse.json({ error: '모임과 시작 라운드를 확인하세요.' }, { status: 400 });
  }
  if (matchCount && (!Number.isInteger(matchCount) || matchCount < 1)) {
    return NextResponse.json({ error: '지정 경기수는 1 이상의 정수여야 합니다.' }, { status: 400 });
  }

  const db = getServerSupabase();
  const { data: event } = await db.from('events').select('id,court_count').eq('id', eventId).single();
  if (!event) return NextResponse.json({ error: '모임을 찾을 수 없습니다.' }, { status: 404 });

  const { data: regs } = await db
    .from('registrations')
    .select('members(id,name,gender,level)')
    .eq('event_id', eventId)
    .in('status', ['applied', 'checked_in']);
  const players = (regs || [])
    .map((row: any) => ({ memberId: row.members?.id, name: row.members?.name, gender: row.members?.gender, level: row.members?.level }))
    .filter((player: any) => player.memberId && player.name);

  if (players.length < 4) {
    return NextResponse.json({ error: '대진 생성에는 참가자 4명 이상이 필요합니다.' }, { status: 400 });
  }

  if (replaceExisting) {
    const { error: deleteError } = await db.from('matches').delete().eq('event_id', eventId);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const generated = generateSimpleDoublesMatches({
    players,
    courtCount: event.court_count || 1,
    roundNo,
    matchCount: matchCount || undefined,
  });

  for (const item of generated) {
    const { data: court } = await db.from('courts').select('id').eq('event_id', eventId).eq('court_no', item.courtNo).single();
    const { data: match, error } = await db
      .from('matches')
      .insert({ event_id: eventId, court_id: court?.id, round_no: item.roundNo, match_no: item.matchNo, status: 'scheduled' })
      .select('id')
      .single();
    if (error || !match) return NextResponse.json({ error: error?.message || '경기 저장 실패' }, { status: 500 });

    const rows = [
      ...item.teamA.map((player, index) => ({ match_id: match.id, member_id: player.memberId, team: 'A', position_no: index + 1 })),
      ...item.teamB.map((player, index) => ({ match_id: match.id, member_id: player.memberId, team: 'B', position_no: index + 1 })),
    ];
    const { error: playerError } = await db.from('match_players').insert(rows);
    if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 });
  }

  await db.from('events').update({ status: 'running' }).eq('id', eventId);

  return NextResponse.json({ count: generated.length });
}
