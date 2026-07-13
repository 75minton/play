import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { getParticipantEventSession } from '@/lib/event-session';
import { getServerSupabase } from '@/lib/supabase/server';

function teamNames(match: any, team: 'A' | 'B') {
  return (match.match_players || [])
    .filter((player: any) => player.team === team)
    .sort((a: any, b: any) => a.position_no - b.position_no)
    .map((player: any) => player.members?.name)
    .filter(Boolean);
}

function toMatchView(match: any) {
  return {
    id: match.id,
    event_id: match.event_id,
    round_no: match.round_no,
    match_no: match.match_no,
    status: match.status,
    team_a_score: match.team_a_score || 0,
    team_b_score: match.team_b_score || 0,
    winner_team: match.winner_team,
    court_no: match.courts?.court_no ?? null,
    court_name: match.courts?.name ?? null,
    team_a_names: teamNames(match, 'A'),
    team_b_names: teamNames(match, 'B'),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const participantSession = await getParticipantEventSession();
  const eventId = searchParams.get('event_id') || participantSession?.eventId || '';
  const db = getServerSupabase();

  const { data: events, error: eventError } = await db
    .from('events')
    .select('id,title,event_date,location,court_count,status')
    .in('status', ['open', 'closed', 'running'])
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  const selectedEventId = eventId || events?.[0]?.id || '';
  const selectedEvent = (events || []).find((event) => event.id === selectedEventId) || events?.[0] || null;

  const { data: courts, error: courtError } = selectedEventId
    ? await db.from('courts').select('id,court_no,name').eq('event_id', selectedEventId).order('court_no', { ascending: true })
    : { data: [] as any[], error: null };
  if (courtError) return NextResponse.json({ error: courtError.message }, { status: 500 });

  const { data: matches, error: matchError } = selectedEventId
    ? await db
        .from('matches')
        .select('id,event_id,round_no,match_no,status,team_a_score,team_b_score,winner_team,courts(court_no,name),match_players(team,position_no,members(name))')
        .eq('event_id', selectedEventId)
        .in('status', ['scheduled', 'playing', 'paused'])
        .order('round_no', { ascending: true })
        .order('match_no', { ascending: true })
    : { data: [] as any[], error: null };
  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });

  const matchViews = (matches || []).map(toMatchView);
  const currentByCourt = (courts || []).map((court: any) => {
    const courtMatches = matchViews.filter((match: any) => match.court_no === court.court_no);
    const current = courtMatches.find((match: any) => match.status === 'playing') || courtMatches[0] || null;
    return {
      court_no: court.court_no,
      court_name: court.name || `${court.court_no}코트`,
      match: current,
    };
  });
  const currentIds = new Set(currentByCourt.map((item: any) => item.match?.id).filter(Boolean));
  const waitingMatches = matchViews.filter((match: any) => !currentIds.has(match.id));
  const adminSession = await getAdminSession();

  return NextResponse.json({
    events: events || [],
    selected_event_id: selectedEventId,
    selected_event: selectedEvent,
    courts: currentByCourt,
    waiting_matches: waitingMatches,
    is_admin: Boolean(adminSession),
    has_participant_event: Boolean(participantSession),
  });
}
