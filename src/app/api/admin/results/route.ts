import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { calcWinner } from '@/lib/matchmaker';

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
    round_no: match.round_no,
    match_no: match.match_no,
    court_no: match.courts?.court_no ?? null,
    court_name: match.courts?.name ?? null,
    status: match.status,
    team_a_score: match.team_a_score || 0,
    team_b_score: match.team_b_score || 0,
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
  const { data: events, error: eventError } = await db.from('events').select('id,title,event_date,location,status').order('event_date', { ascending: false });
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  const selectedEventId = eventId || events?.[0]?.id || '';
  const { data: matches, error: matchError } = selectedEventId
    ? await db
        .from('matches')
        .select('id,round_no,match_no,status,team_a_score,team_b_score,winner_team,courts(court_no,name),match_players(team,position_no,members(name))')
        .eq('event_id', selectedEventId)
        .order('round_no', { ascending: true })
        .order('match_no', { ascending: true })
    : { data: [] as any[], error: null };
  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });

  return NextResponse.json({
    events: events || [],
    selected_event_id: selectedEventId,
    matches: (matches || []).map(toMatchView),
  });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const matchId = String(body.match_id || '').trim();
  const teamAScore = Number(body.team_a_score);
  const teamBScore = Number(body.team_b_score);
  const requestedStatus = String(body.status || '').trim();
  const finish = body.finish !== false;

  if (!matchId || !Number.isInteger(teamAScore) || teamAScore < 0 || !Number.isInteger(teamBScore) || teamBScore < 0) {
    return NextResponse.json({ error: '경기와 점수를 확인하세요.' }, { status: 400 });
  }
  if (finish && teamAScore === 0 && teamBScore === 0) {
    return NextResponse.json({ error: '경기 종료 전 점수를 입력하세요.' }, { status: 400 });
  }

  const nextStatus = requestedStatus || (finish ? 'finished' : 'playing');
  if (!['scheduled', 'playing', 'paused', 'finished'].includes(nextStatus)) {
    return NextResponse.json({ error: '경기 상태가 올바르지 않습니다.' }, { status: 400 });
  }

  const { error } = await getServerSupabase()
    .from('matches')
    .update({
      team_a_score: teamAScore,
      team_b_score: teamBScore,
      winner_team: nextStatus === 'finished' ? calcWinner(teamAScore, teamBScore) : null,
      status: nextStatus,
    })
    .eq('id', matchId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
