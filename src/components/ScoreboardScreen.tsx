'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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

function calcAutoColumns(width: number, courtCount: number) {
  const safeCourtCount = Math.max(1, courtCount || 1);
  if (width < 820) return 1;
  if (width < 1240) return Math.min(2, safeCourtCount);
  if (width < 1640) return Math.min(3, safeCourtCount);
  return Math.min(4, safeCourtCount);
}

function TeamPanel({ label, names, score, color }: { label: string; names: string[]; score: number; color: 'blue' | 'rose' }) {
  const colorClass = color === 'blue' ? 'border-blue-400 bg-blue-950/55' : 'border-rose-400 bg-rose-950/55';
  const slots = names.length ? names.slice(0, 2) : ['-'];
  while (slots.length < 2) slots.push('-');

  return (
    <div className={`flex min-h-[190px] flex-col rounded-3xl border p-4 ${colorClass}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-black text-gray-950">{label}팀</span>
        <span className="text-[clamp(2.75rem,4vw,4.25rem)] font-black leading-none tabular-nums">{score}</span>
      </div>
      <div className="mt-auto grid gap-2 pt-4">
        {slots.map((name, index) => (
          <div key={`${name}-${index}`} className={`truncate rounded-2xl bg-white/10 px-4 py-3 text-[clamp(1.05rem,1.5vw,1.55rem)] font-black ${name === '-' ? 'text-white/45' : ''}`}>
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
    <div className="mt-4 rounded-3xl bg-white/10 p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-bold text-white/80">
          A팀 점수
          <input className="mt-1 w-full rounded-2xl border border-white/20 bg-gray-950 px-4 py-3 text-2xl font-black text-white" type="number" min={0} value={teamAScore} onChange={(event) => setTeamAScore(Number(event.target.value))} />
        </label>
        <label className="text-sm font-bold text-white/80">
          B팀 점수
          <input className="mt-1 w-full rounded-2xl border border-white/20 bg-gray-950 px-4 py-3 text-2xl font-black text-white" type="number" min={0} value={teamBScore} onChange={(event) => setTeamBScore(Number(event.target.value))} />
        </label>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <button className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-gray-950 disabled:opacity-60" disabled={saving} onClick={() => save('playing')} type="button">
          경기진행
        </button>
        <button className="rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-black text-gray-950 disabled:opacity-60" disabled={saving} onClick={() => save('paused')} type="button">
          일시중지
        </button>
        <button className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-gray-950 disabled:opacity-60" disabled={saving} onClick={() => save('finished')} type="button">
          경기종료
        </button>
      </div>
      {message && <p className="mt-3 text-sm font-bold text-yellow-200">{message}</p>}
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
    const url = eventId ? `/api/scoreboard?event_id=${encodeURIComponent(eventId)}` : '/api/scoreboard';
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
    <main className="min-h-screen bg-gray-950 p-3 text-white md:p-5">
      <header className="mb-4 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-black text-gray-950">
              75Rabbit
            </Link>
            <span className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-gray-950">전광판</span>
            {viewOnly && <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">일반 뷰 전용</span>}
            {canManageScore && <span className="rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-gray-950">관리자 점수 입력 가능</span>}
          </div>
          <h1 className="mt-3 text-[clamp(1.9rem,3.5vw,3.6rem)] font-black leading-tight">{selectedEvent?.title || '진행 중인 모임 없음'}</h1>
          <p className="mt-1 text-base font-bold text-white/60 md:text-lg">{selectedEvent ? `${selectedEvent.event_date} · ${selectedEvent.location || '장소 미정'}` : '모임관리에서 모임과 대진을 생성하세요.'}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {!viewOnly && (
            <select className="rounded-2xl border border-white/20 bg-gray-900 px-4 py-3 font-bold text-white" value={selectedEventId} onChange={(event) => loadScoreboard(event.target.value)}>
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
              className="rounded-2xl border border-white/20 bg-gray-900 px-4 py-3 font-bold text-white"
              value={displayColumns}
              onChange={(event) => {
                setDisplayColumns(event.target.value);
                window.localStorage.setItem('75rabbit_scoreboard_columns', event.target.value);
              }}
            >
              <option value="auto">화면 자동 배치 ({effectiveColumns}열)</option>
              <option value="1">수동 1열</option>
              <option value="2">수동 2열</option>
              <option value="3">수동 3열</option>
              <option value="4">수동 4열</option>
            </select>
          )}
          <button className="rounded-2xl bg-white px-5 py-3 font-black text-gray-950" onClick={() => loadScoreboard()} type="button">
            새로고침
          </button>
          {canManageScore && (
            <>
              <Link className="rounded-2xl bg-gray-800 px-5 py-3 text-center font-black text-white" href={`/admin?event_id=${selectedEventId}`}>
                관리자 메인
              </Link>
              <Link className="rounded-2xl bg-gray-800 px-5 py-3 text-center font-black text-white" href={`/admin/results?event_id=${selectedEventId}`}>
                결과입력
              </Link>
            </>
          )}
        </div>
      </header>

      {error && <p className="mb-4 rounded-2xl bg-red-500/20 p-4 font-bold text-red-100">{error}</p>}
      {loading ? (
        <section className="rounded-3xl bg-white/5 p-8 text-center text-2xl font-black">전광판을 불러오는 중입니다.</section>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px] 2xl:grid-cols-[1fr_400px]">
          <section className="grid auto-rows-fr gap-4" style={{ gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0, 1fr))` }}>
            {courts.map((court) => (
              <article key={court.court_no} className="flex min-h-[430px] flex-col rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl">
                <div className="mb-4 flex min-h-[70px] items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">Court</p>
                    <h2 className="truncate text-[clamp(2rem,3vw,3rem)] font-black">{court.court_name}</h2>
                  </div>
                  {court.match ? (
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-white/50">현재 경기</p>
                      <p className="text-2xl font-black">
                        R{court.match.round_no}-{court.match.match_no}
                      </p>
                      <span className="mt-1 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black">{statusText[court.match.status] || court.match.status}</span>
                    </div>
                  ) : (
                    <span className="shrink-0 rounded-full bg-white/10 px-4 py-2 font-bold text-white/50">배정 없음</span>
                  )}
                </div>

                {court.match ? (
                  <>
                    <div className="grid flex-1 gap-4 md:grid-cols-2">
                      <TeamPanel label="A" names={court.match.team_a_names} score={court.match.team_a_score} color="blue" />
                      <TeamPanel label="B" names={court.match.team_b_names} score={court.match.team_b_score} color="rose" />
                    </div>
                    {canManageScore && <AdminScoreControls match={court.match} onSaved={() => loadScoreboard(selectedEventId)} />}
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-white/20 p-10 text-center text-2xl font-black text-white/40">대기 중</div>
                )}
              </article>
            ))}
            {courts.length === 0 && <div className="rounded-3xl bg-white/5 p-10 text-center text-2xl font-black text-white/60">표시할 코트가 없습니다. 설정에서 코트 수를 확인하세요.</div>}
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">대기 경기</h2>
                <p className="mt-1 text-sm font-bold text-white/50">코트 수만큼 먼저 표시합니다.</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-black text-gray-950">{waitingMatches.length}개</span>
            </div>
            <div className="grid gap-3">
              {visibleWaitingMatches.map((match) => (
                <div key={match.id} className="min-h-[116px] rounded-3xl bg-gray-900 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-lg">
                      R{match.round_no}-{match.match_no}
                    </b>
                    <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{match.court_name || `${match.court_no || '-'}코트`}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm font-bold text-white/80">
                    <p className="truncate">
                      <span className="text-blue-300">A</span> {match.team_a_names.join(' / ') || '-'}
                    </p>
                    <p className="truncate">
                      <span className="text-rose-300">B</span> {match.team_b_names.join(' / ') || '-'}
                    </p>
                  </div>
                </div>
              ))}
              {waitingMatches.length === 0 && <p className="rounded-3xl bg-gray-900 p-6 text-center font-bold text-white/50">대기 경기가 없습니다.</p>}
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
