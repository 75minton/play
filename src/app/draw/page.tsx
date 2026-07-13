import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getParticipantEventSession } from '@/lib/event-session';
import { getServerSupabase } from '@/lib/supabase/server';

const statusLabel: Record<string, string> = {
  playing: '진행',
  scheduled: '대기',
  finished: '종료',
};

const statusClass: Record<string, string> = {
  playing: 'border-emerald-300 bg-emerald-50',
  scheduled: 'border-blue-100 bg-white',
  finished: 'border-gray-200 bg-gray-100 text-gray-500',
};

export default async function DrawPage() {
  const session = await getParticipantEventSession();
  if (!session) redirect('/');

  const { data } = await getServerSupabase()
    .from('matches')
    .select('id,round_no,match_no,status,team_a_score,team_b_score,courts(court_no,name),match_players(team,position_no,members(name,level))')
    .eq('event_id', session.eventId)
    .order('round_no', { ascending: true })
    .order('match_no', { ascending: true })
    .limit(200);

  return (
    <AppShell>
      <section className="card">
        <h1 className="text-2xl font-black">대진표</h1>
        <p className="mt-2 text-sm text-gray-600">경기상태는 진행/대기/종료로 표시됩니다.</p>
        <div className="mt-5 grid gap-4">
          {(data || []).map((match: any) => {
            const teamA = (match.match_players || []).filter((p: any) => p.team === 'A').sort((a: any, b: any) => a.position_no - b.position_no);
            const teamB = (match.match_players || []).filter((p: any) => p.team === 'B').sort((a: any, b: any) => a.position_no - b.position_no);
            return (
              <div key={match.id} className={`rounded-2xl border p-4 ${statusClass[match.status] || 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <b>
                    R{match.round_no} - {match.match_no}경기
                  </b>
                  <div className="flex gap-2">
                    <span className="badge">{match.courts?.name || `${match.courts?.court_no || '-'}코트`}</span>
                    <span className="badge">{statusLabel[match.status] || match.status}</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-white/70 p-3">
                    <b>A팀</b>
                    <p>{teamA.map((p: any) => p.members?.name).join(' / ') || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <b>B팀</b>
                    <p>{teamB.map((p: any) => p.members?.name).join(' / ') || '-'}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {(!data || data.length === 0) && <p className="text-gray-500">생성된 대진표가 없습니다.</p>}
        </div>
      </section>
    </AppShell>
  );
}
