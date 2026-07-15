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
        <div>
          <span className="badge">결과</span>
          <h1 className="section-title mt-3">경기 결과 확인</h1>
          <p className="helper-text mt-2">종료 처리된 경기의 점수와 승리팀을 확인할 수 있습니다.</p>
        </div>
        <div className="mt-6 grid gap-4">
          {(data || []).map((match: any) => {
            const teamA = (match.match_players || []).filter((p: any) => p.team === 'A').map((p: any) => p.members?.name).join(' / ');
            const teamB = (match.match_players || []).filter((p: any) => p.team === 'B').map((p: any) => p.members?.name).join(' / ');
            return (
              <div key={match.id} className="rounded-3xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <b>
                    R{match.round_no} - {match.match_no}경기
                  </b>
                  <span className="badge">승리팀 {match.winner_team || '-'}</span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                  <p className="rounded-2xl bg-blue-50 p-3">
                    <b className="text-blue-700">A팀</b> {teamA || '-'}
                  </p>
                  <p className="rounded-2xl bg-rose-50 p-3">
                    <b className="text-rose-700">B팀</b> {teamB || '-'}
                  </p>
                </div>
                <p className="mt-4 text-3xl font-black tabular-nums">
                  A {match.team_a_score} : {match.team_b_score} B
                </p>
              </div>
            );
          })}
          {(!data || data.length === 0) && <p className="rounded-3xl bg-gray-50 p-8 text-center font-bold text-gray-500">입력된 결과가 없습니다.</p>}
        </div>
      </section>
    </AppShell>
  );
}
