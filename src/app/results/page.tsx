import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getParticipantEventSession } from '@/lib/event-session';
import { getServerSupabase } from '@/lib/supabase/server';

export default async function ResultsPage() {
  const session = await getParticipantEventSession();
  if (!session) redirect('/');

  const { data } = await getServerSupabase()
    .from('matches')
    .select('id,round_no,match_no,status,team_a_score,team_b_score,winner_team,courts(name),match_players(team,position_no,members(name))')
    .eq('event_id', session.eventId)
    .eq('status', 'finished')
    .order('round_no', { ascending: true })
    .order('match_no', { ascending: true });

  return (
    <AppShell>
      <section className="card">
        <h1 className="text-2xl font-black">결과 확인</h1>
        <div className="mt-5 grid gap-3">
          {(data || []).map((match: any) => {
            const teamA = (match.match_players || []).filter((p: any) => p.team === 'A').map((p: any) => p.members?.name).join(' / ');
            const teamB = (match.match_players || []).filter((p: any) => p.team === 'B').map((p: any) => p.members?.name).join(' / ');
            return (
              <div key={match.id} className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <b>
                    R{match.round_no} - {match.match_no}경기
                  </b>
                  <span className="badge">승리팀 {match.winner_team || '-'}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                  <p>A팀 {teamA || '-'}</p>
                  <p>B팀 {teamB || '-'}</p>
                </div>
                <p className="mt-2 text-2xl font-black">
                  A {match.team_a_score} : {match.team_b_score} B
                </p>
              </div>
            );
          })}
          {(!data || data.length === 0) && <p className="text-gray-500">입력된 결과가 없습니다.</p>}
        </div>
      </section>
    </AppShell>
  );
}
