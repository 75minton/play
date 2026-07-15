import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getParticipantEventSession } from '@/lib/event-session';
import { getServerSupabase } from '@/lib/supabase/server';

const statusLabel: Record<string, string> = {
  playing: '진행',
  scheduled: '대기',
  paused: '일시중지',
  finished: '종료',
};

const statusClass: Record<string, string> = {
  playing: 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100',
  scheduled: 'border-blue-100 bg-white',
  paused: 'border-yellow-300 bg-yellow-50',
  finished: 'border-gray-200 bg-gray-100 text-gray-500',
};

function formatDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function playerLabel(player: any) {
  const name = player.members?.name || '-';
  const level = player.members?.level ? ` ${player.members.level}` : '';
  return `${name}${level}`;
}

export default async function DrawPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const session = await getParticipantEventSession();
  if (!session) redirect('/');

  const params = await searchParams;
  const query = String(params?.q || '').trim().toLowerCase();

  const { data } = await getServerSupabase()
    .from('matches')
    .select('id,round_no,match_no,status,team_a_score,team_b_score,updated_at,courts(court_no,name),match_players(team,position_no,members(name,level))')
    .eq('event_id', session.eventId)
    .order('round_no', { ascending: true })
    .order('match_no', { ascending: true })
    .limit(300);

  const matches = (data || []).filter((match: any) => {
    if (!query) return true;
    return (match.match_players || []).some((player: any) => String(player.members?.name || '').toLowerCase().includes(query));
  });

  return (
    <AppShell>
      <section className="card">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-black">대진표</h1>
            <p className="mt-2 text-sm text-gray-600">현재 진행중인 경기는 초록색, 종료된 경기는 회색으로 표시됩니다.</p>
          </div>
          <form className="flex gap-2" action="/draw">
            <input className="input md:w-72" name="q" defaultValue={query} placeholder="선수 이름 검색" />
            <button className="btn" type="submit">
              검색
            </button>
          </form>
        </div>

        <div className="mt-5 grid gap-4">
          {matches.map((match: any) => {
            const teamA = (match.match_players || []).filter((p: any) => p.team === 'A').sort((a: any, b: any) => a.position_no - b.position_no);
            const teamB = (match.match_players || []).filter((p: any) => p.team === 'B').sort((a: any, b: any) => a.position_no - b.position_no);
            const finishedAt = match.status === 'finished' ? formatDateTime(match.updated_at) : '';
            return (
              <div key={match.id} className={`rounded-2xl border p-4 ${statusClass[match.status] || 'bg-white'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <b>
                    R{match.round_no} - {match.match_no}경기
                  </b>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge">{match.courts?.name || `${match.courts?.court_no || '-'}코트`}</span>
                    <span className="badge">{statusLabel[match.status] || match.status}</span>
                    {finishedAt && <span className="badge">종료 {finishedAt}</span>}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-white/75 p-3">
                    <b>A팀</b>
                    <p>{teamA.map(playerLabel).join(' / ') || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-white/75 p-3">
                    <b>B팀</b>
                    <p>{teamB.map(playerLabel).join(' / ') || '-'}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {matches.length === 0 && <p className="text-gray-500">표시할 대진표가 없습니다.</p>}
        </div>
      </section>
    </AppShell>
  );
}
