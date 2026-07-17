'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';

type EventOption = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  court_count: number;
  status: string;
};

type MatchView = {
  id: string;
  round_no: number;
  match_no: number;
  status: string;
  team_a_score: number;
  team_b_score: number;
  winner_team: 'A' | 'B' | null;
  court_no: number | null;
  court_name: string | null;
  team_a_names: string[];
  team_b_names: string[];
};

type CourtBlock = {
  court_no: number;
  court_name: string;
  match: MatchView | null;
};

const statusText: Record<string, string> = {
  scheduled: '대기',
  playing: '경기진행',
  paused: '일시중지',
  finished: '경기종료',
};

const statusClass: Record<string, string> = {
  scheduled: 'border border-slate-400/30 bg-slate-700 text-white',
  playing: 'border border-emerald-200 bg-emerald-300 text-emerald-950',
  paused: 'border border-amber-200 bg-amber-300 text-amber-950',
  finished: 'border border-slate-200 bg-slate-200 text-slate-900',
};

function calcAutoColumns(width: number, courtCount: number) {
  const safeCourtCount = Math.max(1, courtCount || 1);
  if (width < 860) return 1;
  if (width < 1320) return Math.min(2, safeCourtCount);
  if (width < 1760) return Math.min(3, safeCourtCount);
  return Math.min(4, safeCourtCount);
}

function TeamPanel({ label, names, score, tone }: { label: string; names: string[]; score: number; tone: 'blue' | 'rose' }) {
  const colorClass = tone === 'blue' ? 'border-cyan-300 bg-[#075985]' : 'border-pink-300 bg-[#9d174d]';
  const labelClass = tone === 'blue' ? 'text-cyan-950' : 'text-pink-950';
  const chipClass = tone === 'blue' ? 'bg-cyan-100' : 'bg-pink-100';
  const slots = names.length ? names.slice(0, 2) : ['-'];
  while (slots.length < 2) slots.push('-');

  return (
    <div className={`flex h-full min-h-[118px] flex-col rounded-2xl border p-2 sm:min-h-[178px] sm:rounded-[1.5rem] sm:p-4 ${colorClass}`}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <span className={`shrink-0 rounded-full ${chipClass} px-2 py-0.5 text-[0.68rem] font-black sm:px-3 sm:py-1 sm:text-sm ${labelClass}`}>{label}팀</span>
        <span className="text-[2.15rem] font-black leading-[0.9] tracking-tight tabular-nums sm:text-[clamp(2.7rem,3.7vw,4.4rem)]">{score}</span>
      </div>
      <div className="mt-auto grid gap-1.5 pt-2 sm:gap-2 sm:pt-4">
        {slots.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className={`flex min-h-[32px] items-center truncate rounded-lg border border-white/70 bg-white px-2 text-[0.7rem] font-black leading-none shadow-sm sm:min-h-[44px] sm:rounded-2xl sm:px-4 sm:text-[clamp(1rem,1.25vw,1.42rem)] ${
              name === '-' ? 'text-slate-400' : 'text-slate-950'
            }`}
            title={name}
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminScoreControls({ match, onSaved }: { match: MatchView; onSaved: () => Promise<void> }) {
  const [teamAScore, setTeamAScore] = useState(match.team_a_score || 0);
  const [teamBScore, setTeamBScore] = useState(match.team_b_score || 0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setTeamAScore(match.team_a_score || 0);
    setTeamBScore(match.team_b_score || 0);
    setMessage('');
  }, [match.id, match.team_a_score, match.team_b_score]);

  async function save(status: 'playing' | 'paused' | 'finished') {
    if (status === 'finished' && teamAScore === 0 && teamBScore === 0) {
      setMessage('경기 종료 전 점수를 입력하세요.');
      return;
    }
    if (status === 'finished' && teamAScore === teamBScore) {
      setMessage('동점 점수로는 경기를 종료할 수 없습니다.');
      return;
    }

    setSaving(true);
    setMessage('');
    const response = await fetch('/api/admin/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, team_a_score: teamAScore, team_b_score: teamBScore, status, finish: status === 'finished' }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(result.error || '저장 실패');
      return;
    }
    setMessage(status === 'finished' ? '경기 종료 처리 완료' : status === 'paused' ? '일시중지 처리 완료' : '경기진행 처리 완료');
    await onSaved();
  }

  return (
    <div className="mt-2 rounded-2xl border border-white/15 bg-[#08130f] p-2.5 sm:mt-4 sm:rounded-[1.35rem] sm:p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-black text-white/75">
          A팀 점수
          <input className="mt-1 h-10 w-full rounded-xl border border-white/20 bg-gray-950 px-3 text-lg font-black text-white outline-none sm:h-12 sm:rounded-2xl sm:text-xl" type="number" min={0} value={teamAScore} onChange={(event) => setTeamAScore(Number(event.target.value))} />
        </label>
        <label className="text-xs font-black text-white/75">
          B팀 점수
          <input className="mt-1 h-10 w-full rounded-xl border border-white/20 bg-gray-950 px-3 text-lg font-black text-white outline-none sm:h-12 sm:rounded-2xl sm:text-xl" type="number" min={0} value={teamBScore} onChange={(event) => setTeamBScore(Number(event.target.value))} />
        </label>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
        <button className="rounded-xl bg-white px-1 py-2 text-[0.68rem] font-black text-gray-950 disabled:opacity-60 sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-xs" disabled={saving} onClick={() => save('playing')} type="button">
          경기진행
        </button>
        <button className="rounded-xl bg-yellow-300 px-1 py-2 text-[0.68rem] font-black text-gray-950 disabled:opacity-60 sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-xs" disabled={saving} onClick={() => save('paused')} type="button">
          일시중지
        </button>
        <button className="rounded-xl bg-emerald-400 px-1 py-2 text-[0.68rem] font-black text-gray-950 disabled:opacity-60 sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-xs" disabled={saving} onClick={() => save('finished')} type="button">
          경기종료
        </button>
      </div>
      {message && <p className="mt-2 text-xs font-bold text-yellow-200">{message}</p>}
    </div>
  );
}

export function ScoreboardScreen({ viewOnly = false }: { viewOnly?: boolean }) {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null);
  const [courts, setCourts] = useState<CourtBlock[]>([]);
  const [waitingMatches, setWaitingMatches] = useState<MatchView[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayColumns, setDisplayColumns] = useState('auto');
  const [autoColumns, setAutoColumns] = useState(1);
  const [waitingExpanded, setWaitingExpanded] = useState(false);

  const canManageScore = isAdmin && !viewOnly;
  const effectiveColumns = useMemo(() => {
    if (displayColumns !== 'auto') return Math.max(1, Math.min(Number(displayColumns) || 1, Math.max(1, courts.length || 1)));
    return autoColumns;
  }, [autoColumns, courts.length, displayColumns]);
  const waitingPreviewCount = Math.max(1, courts.length || selectedEvent?.court_count || 1);
  const visibleWaitingMatches = waitingExpanded ? waitingMatches : waitingMatches.slice(0, waitingPreviewCount);
  const hiddenWaitingCount = Math.max(0, waitingMatches.length - visibleWaitingMatches.length);

  async function loadScoreboard(eventId = selectedEventId) {
    const params = new URLSearchParams();
    if (viewOnly) params.set('scope', 'participant');
    if (!viewOnly && eventId) params.set('event_id', eventId);
    const url = `/api/scoreboard${params.size ? `?${params}` : ''}`;
    const response = await fetch(url, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || '전광판 정보를 불러오지 못했습니다.');
      setLoading(false);
      return;
    }
    if (viewOnly && !result.has_participant_event) {
      window.location.href = '/';
      return;
    }
    setEvents(result.events || []);
    setSelectedEventId(result.selected_event_id || '');
    setSelectedEvent(result.selected_event || null);
    setCourts(result.courts || []);
    setWaitingMatches(result.waiting_matches || []);
    setIsAdmin(Boolean(result.is_admin));
    setError('');
    setLoading(false);
  }

  useEffect(() => {
    const initialEventId = viewOnly ? '' : new URLSearchParams(window.location.search).get('event_id') || window.localStorage.getItem('75rabbit_admin_event_id') || '';
    setDisplayColumns(window.localStorage.getItem('75rabbit_scoreboard_columns') || 'auto');
    loadScoreboard(initialEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function syncAutoColumns() {
      setAutoColumns(calcAutoColumns(window.innerWidth, courts.length || selectedEvent?.court_count || 1));
    }

    syncAutoColumns();
    window.addEventListener('resize', syncAutoColumns);
    window.addEventListener('orientationchange', syncAutoColumns);
    return () => {
      window.removeEventListener('resize', syncAutoColumns);
      window.removeEventListener('orientationchange', syncAutoColumns);
    };
  }, [courts.length, selectedEvent?.court_count]);

  useEffect(() => {
    setWaitingExpanded(false);
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    const timer = window.setInterval(() => loadScoreboard(selectedEventId), 15000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.16),transparent_30rem),linear-gradient(145deg,#07120e_0%,#030806_75%)] p-3 text-white md:p-4">
      <header className="mb-3 rounded-[1.75rem] border border-emerald-200/20 bg-[#10231b] p-3 shadow-2xl md:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-black text-gray-950">
                75Rabbit
              </Link>
              <span className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-emerald-950">전광판</span>
              {viewOnly && <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">보기 전용</span>}
              {canManageScore && <span className="rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-yellow-950">관리자 입력</span>}
            </div>
            <h1 className="mt-3 truncate text-[clamp(1.75rem,3.2vw,3.4rem)] font-black leading-none tracking-tight">{selectedEvent?.title || '진행 중인 모임 없음'}</h1>
            <p className="mt-2 truncate text-sm font-bold text-slate-300 md:text-base">{selectedEvent ? `${selectedEvent.event_date} · ${selectedEvent.location || '장소 미정'}` : '모임과 대진을 먼저 생성하세요.'}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:items-center">
            {!viewOnly && (
              <select className="h-11 rounded-2xl border border-white/15 bg-gray-950 px-3 text-sm font-black text-white outline-none" value={selectedEventId} onChange={(event) => loadScoreboard(event.target.value)}>
                <option value="">모임 선택</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.event_date} · {event.title}
                  </option>
                ))}
              </select>
            )}
            {canManageScore && (
              <select
                className="h-11 rounded-2xl border border-white/15 bg-gray-950 px-3 text-sm font-black text-white outline-none"
                value={displayColumns}
                onChange={(event) => {
                  setDisplayColumns(event.target.value);
                  window.localStorage.setItem('75rabbit_scoreboard_columns', event.target.value);
                }}
              >
                <option value="auto">자동 배치 ({effectiveColumns}열)</option>
                <option value="1">수동 1열</option>
                <option value="2">수동 2열</option>
                <option value="3">수동 3열</option>
                <option value="4">수동 4열</option>
              </select>
            )}
            <button className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-gray-950" onClick={() => loadScoreboard()} type="button">
              <Icon name="refresh" className="h-4 w-4" />새로고침
            </button>
            {canManageScore && (
              <>
                <Link className="grid h-11 place-items-center rounded-2xl bg-white/10 px-4 text-center text-sm font-black text-white" href={`/admin?event_id=${selectedEventId}`}>
                  관리자
                </Link>
                <Link className="grid h-11 place-items-center rounded-2xl bg-white/10 px-4 text-center text-sm font-black text-white" href={`/admin/results?event_id=${selectedEventId}`}>
                  결과입력
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {error && <p className="mb-3 rounded-2xl bg-red-500/20 p-4 font-bold text-red-100">{error}</p>}
      {loading ? (
        <section className="rounded-[1.75rem] border border-white/10 bg-[#10231b] p-8 text-center text-2xl font-black">전광판을 불러오는 중입니다.</section>
      ) : (
        <div className="grid items-start gap-3 xl:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_380px]">
          <section className="grid auto-rows-fr gap-3" style={{ gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0, 1fr))` }}>
            {courts.map((court) => (
              <article key={court.court_no} className="flex flex-col rounded-[1.25rem] border border-emerald-100/20 bg-[#10231b] p-2.5 shadow-[0_18px_45px_rgba(0,0,0,0.32)] sm:min-h-[390px] sm:rounded-[1.75rem] sm:p-3 md:min-h-[420px] md:p-4">
                <div className="mb-2 flex min-h-[48px] items-start justify-between gap-2 sm:mb-3 sm:min-h-[66px] sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-emerald-300">Court</p>
                    <h2 className="truncate text-xl font-black leading-tight sm:text-[clamp(1.75rem,2.5vw,2.75rem)]">{court.court_name}</h2>
                  </div>
                  {court.match ? (
                    <div className="shrink-0 text-right">
                      <p className="text-[0.7rem] font-bold text-white/45">현재 경기</p>
                      <p className="text-base font-black leading-tight sm:text-xl md:text-2xl">
                        R{court.match.round_no}-{court.match.match_no}
                      </p>
                      <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-[0.7rem] font-black ${statusClass[court.match.status] || 'bg-white/10 text-white'}`}>
                        {statusText[court.match.status] || court.match.status}
                      </span>
                    </div>
                  ) : (
                    <span className="shrink-0 rounded-full border border-slate-500 bg-slate-800 px-3 py-1.5 text-xs font-black text-slate-200">배정 없음</span>
                  )}
                </div>

                {court.match ? (
                  <>
                    <div className="grid flex-1 grid-cols-2 gap-2 sm:gap-3">
                      <TeamPanel label="A" names={court.match.team_a_names} score={court.match.team_a_score} tone="blue" />
                      <TeamPanel label="B" names={court.match.team_b_names} score={court.match.team_b_score} tone="rose" />
                    </div>
                    {canManageScore && <AdminScoreControls match={court.match} onSaved={() => loadScoreboard(selectedEventId)} />}
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-[1.5rem] border border-dashed border-emerald-200/30 bg-[#0a1712] p-8 text-center text-2xl font-black text-slate-300">대기 중</div>
                )}
              </article>
            ))}
            {courts.length === 0 && <div className="rounded-[1.75rem] border border-white/10 bg-[#10231b] p-10 text-center text-2xl font-black text-slate-300">표시할 코트가 없습니다. 설정에서 코트 수를 확인하세요.</div>}
          </section>

          <aside className="rounded-[1.75rem] border border-emerald-100/20 bg-[#10231b] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.28)] md:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black md:text-2xl">대기 경기</h2>
                <p className="mt-1 text-xs font-bold text-slate-300">코트 수만큼 먼저 표시합니다.</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-gray-950">{waitingMatches.length}개</span>
            </div>
            <div className="grid gap-2.5">
              {visibleWaitingMatches.map((match) => (
                <div key={match.id} className="min-h-[86px] rounded-2xl border border-slate-700 bg-[#08130f] p-3 shadow-inner sm:min-h-[104px] sm:rounded-[1.4rem]">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-base">R{match.round_no}-{match.match_no}</b>
                    <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[0.68rem] font-bold">{match.court_name || `${match.court_no || '-'}코트`}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm font-bold text-slate-100">
                    <p className="truncate" title={match.team_a_names.join(' / ') || '-'}>
                      <span className="text-blue-300">A</span> {match.team_a_names.join(' / ') || '-'}
                    </p>
                    <p className="truncate" title={match.team_b_names.join(' / ') || '-'}>
                      <span className="text-rose-300">B</span> {match.team_b_names.join(' / ') || '-'}
                    </p>
                  </div>
                </div>
              ))}
              {waitingMatches.length === 0 && <p className="rounded-[1.4rem] border border-slate-700 bg-[#08130f] p-6 text-center font-bold text-slate-300">대기 경기가 없습니다.</p>}
              {hiddenWaitingCount > 0 && (
                <button className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15" type="button" onClick={() => setWaitingExpanded(true)}>
                  나머지 대기 경기 {hiddenWaitingCount}개 펼치기
                </button>
              )}
              {waitingExpanded && waitingMatches.length > waitingPreviewCount && (
                <button className="rounded-2xl border border-white/10 bg-gray-900 px-4 py-3 text-sm font-black text-white/70 hover:text-white" type="button" onClick={() => setWaitingExpanded(false)}>
                  코트 수만큼만 보기
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
