import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getParticipantEventSession } from '@/lib/event-session';
import { getServerSupabase } from '@/lib/supabase/server';
import { Icon } from '@/components/Icon';

const statusLabel: Record<string, string> = {
  playing: '진행중',
  scheduled: '대기중',
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

export default async function DrawPage({ searchParams }: { searchParams?: Promise<{ q?: string; status?: string }> }) {
  const session = await getParticipantEventSession();
  if (!session) redirect('/');

  const params = await searchParams;
  const query = String(params?.q || '').trim().toLowerCase();
  const requestedStatus = String(params?.status || 'all');
  const statusFilter = ['playing', 'scheduled', 'finished'].includes(requestedStatus) ? requestedStatus : 'all';

  const { data } = await getServerSupabase()
    .from('matches')
    .select('id,round_no,match_no,status,team_a_score,team_b_score,updated_at,courts(court_no,name),match_players(team,position_no,members(name,level))')
    .eq('event_id', session.eventId)
    .order('round_no', { ascending: true })
    .order('match_no', { ascending: true })
    .limit(300);

  const matches = (data || []).filter((match: any) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'playing' ? ['playing', 'paused'].includes(match.status) : match.status === statusFilter);
    const matchesPlayer =
      !query || (match.match_players || []).some((player: any) => String(player.members?.name || '').toLowerCase().includes(query));
    return matchesStatus && matchesPlayer;
  });

  return (
    <AppShell>
      <section className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="badge">{matches.length}경기</span>
            <h1 className="section-title mt-3">대진표</h1>
            <p className="helper-text mt-2">선수 이름과 경기 상태를 함께 선택해 빠르게 찾을 수 있습니다.</p>
          </div>
          <form className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_160px_auto] lg:max-w-2xl" action="/draw">
            <label className="field-label">
              <span className="sr-only">선수 이름</span>
              <input className="input" name="q" defaultValue={query} placeholder="선수 이름 검색" />
            </label>
            <label className="field-label">
              <span className="sr-only">경기 상태</span>
              <select className="input" name="status" defaultValue={statusFilter}>
                <option value="all">전체 상태</option>
                <option value="playing">경기 진행중</option>
                <option value="scheduled">경기 대기중</option>
                <option value="finished">경기 종료</option>
              </select>
            </label>
            <button className="btn gap-2" type="submit">
              <Icon name="search" className="h-5 w-5" />검색
            </button>
          </form>
        </div>

        <div className="mt-5 grid gap-4">
          {matches.map((match: any) => {
            const teamA = (match.match_players || []).filter((p: any) => p.team === 'A').sort((a: any, b: any) => a.position_no - b.position_no);
            const teamB = (match.match_players || []).filter((p: any) => p.team === 'B').sort((a: any, b: any) => a.position_no - b.position_no);
            const finishedAt = match.status === 'finished' ? formatDateTime(match.updated_at) : '';
            return (
              <article key={match.id} className={`rounded-2xl border p-4 sm:p-5 ${statusClass[match.status] || 'bg-white'}`}>
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
                <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="rounded-xl bg-white/85 p-3">
                    <b>A팀</b>
                    <p className="mt-1 text-sm font-semibold leading-6">{teamA.map(playerLabel).join(' / ') || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-white/85 p-3">
                    <b>B팀</b>
                    <p className="mt-1 text-sm font-semibold leading-6">{teamB.map(playerLabel).join(' / ') || '-'}</p>
                  </div>
                </div>
              </article>
            );
          })}
          {matches.length === 0 && <p className="alert py-8 text-center text-gray-500">검색 조건에 맞는 경기가 없습니다.</p>}
        </div>
      </section>
    </AppShell>
  );
}
