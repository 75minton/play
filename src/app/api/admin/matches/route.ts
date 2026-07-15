import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { generateSimpleDoublesMatches } from '@/lib/matchmaker';

function teamPlayers(match: any, team: 'A' | 'B') {
  return (match.match_players || [])
    .filter((player: any) => player.team === team)
    .sort((a: any, b: any) => a.position_no - b.position_no)
    .map((player: any) => ({
      member_id: player.member_id,
      name: player.members?.name,
      level: player.members?.level,
      position_no: player.position_no,
    }))
    .filter((player: any) => player.member_id);
}

function toMatchView(match: any) {
  const teamA = teamPlayers(match, 'A');
  const teamB = teamPlayers(match, 'B');
  return {
    id: match.id,
    event_id: match.event_id,
    round_no: match.round_no,
    match_no: match.match_no,
    status: match.status,
    court_no: match.courts?.court_no ?? null,
    court_name: match.courts?.name ?? null,
    team_a_score: match.team_a_score || 0,
    team_b_score: match.team_b_score || 0,
    winner_team: match.winner_team,
    team_a_players: teamA,
    team_b_players: teamB,
    team_a_names: teamA.map((player: any) => player.level ? `${player.name} ${player.level}` : player.name).filter(Boolean),
    team_b_names: teamB.map((player: any) => player.level ? `${player.name} ${player.level}` : player.name).filter(Boolean),
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

  const { data: courts } = selectedEventId
    ? await db.from('courts').select('id,court_no,name').eq('event_id', selectedEventId).order('court_no', { ascending: true })
    : { data: [] as any[] };

  const { data: matches, error: matchError } = selectedEventId
    ? await db
        .from('matches')
        .select('id,event_id,round_no,match_no,status,team_a_score,team_b_score,winner_team,courts(court_no,name),match_players(team,position_no,member_id,members(name,level))')
        .eq('event_id', selectedEventId)
        .order('round_no', { ascending: true })
        .order('match_no', { ascending: true })
    : { data: [] as any[], error: null };
  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });

  const availableMembers = (registrations || [])
    .map((row: any) => ({
      id: row.members?.id,
      name: row.members?.name,
      gender: row.members?.gender,
      level: row.members?.level,
    }))
    .filter((member: any) => member.id && member.name);

  return NextResponse.json({
    events: events || [],
    selected_event_id: selectedEventId,
    eligible_player_count: availableMembers.length,
    available_members: availableMembers,
    courts: courts || [],
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

  let existingPlayCounts: Record<string, number> = {};
  let startMatchNo = 1;

  if (replaceExisting) {
    const { error: deleteError } = await db.from('matches').delete().eq('event_id', eventId);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  } else {
    const { data: existingMatches } = await db
      .from('matches')
      .select('match_no,match_players(member_id)')
      .eq('event_id', eventId)
      .order('match_no', { ascending: false });
    startMatchNo = Math.max(0, ...(existingMatches || []).map((match: any) => Number(match.match_no) || 0)) + 1;
    existingPlayCounts = {};
    (existingMatches || []).forEach((match: any) => {
      (match.match_players || []).forEach((player: any) => {
        if (player.member_id) existingPlayCounts[player.member_id] = (existingPlayCounts[player.member_id] || 0) + 1;
      });
    });
  }

  const generated = generateSimpleDoublesMatches({
    players,
    courtCount: event.court_count || 1,
    roundNo,
    matchCount: matchCount || undefined,
    existingPlayCounts,
    startMatchNo,
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

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const matchId = String(body.match_id || '').trim();
  if (!matchId) return NextResponse.json({ error: '수정할 경기를 선택하세요.' }, { status: 400 });

  const db = getServerSupabase();
  const updates: Record<string, any> = {};
  if (body.round_no !== undefined) updates.round_no = Number(body.round_no);
  if (body.match_no !== undefined) updates.match_no = Number(body.match_no);
  if (body.status !== undefined) updates.status = String(body.status);
  if (body.court_id !== undefined) updates.court_id = body.court_id || null;

  if (Object.keys(updates).length) {
    if (updates.round_no && (!Number.isInteger(updates.round_no) || updates.round_no < 1)) return NextResponse.json({ error: '라운드 번호를 확인하세요.' }, { status: 400 });
    if (updates.match_no && (!Number.isInteger(updates.match_no) || updates.match_no < 1)) return NextResponse.json({ error: '경기 번호를 확인하세요.' }, { status: 400 });
    if (updates.status && !['scheduled', 'playing', 'paused', 'finished'].includes(updates.status)) return NextResponse.json({ error: '경기 상태가 올바르지 않습니다.' }, { status: 400 });
    const { error } = await db.from('matches').update(updates).eq('id', matchId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const replacements = Array.isArray(body.replacements) ? body.replacements : [];
  for (const replacement of replacements) {
    const team = replacement.team === 'B' ? 'B' : 'A';
    const positionNo = Number(replacement.position_no);
    const memberId = String(replacement.member_id || '').trim();
    if (![1, 2].includes(positionNo) || !memberId) continue;
    const { error } = await db
      .from('match_players')
      .update({ member_id: memberId })
      .eq('match_id', matchId)
      .eq('team', team)
      .eq('position_no', positionNo);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('match_id');
  if (!matchId) return NextResponse.json({ error: '삭제할 경기를 선택하세요.' }, { status: 400 });

  const { error } = await getServerSupabase().from('matches').delete().eq('id', matchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
