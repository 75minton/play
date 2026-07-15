'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';

type EventOption = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  status: string;
};

type MatchView = {
  id: string;
  round_no: number;
  match_no: number;
  court_no: number | null;
  court_name: string | null;
  status: string;
  team_a_score: number;
  team_b_score: number;
  winner_team: 'A' | 'B' | null;
  team_a_names: string[];
  team_b_names: string[];
};

const statusLabel: Record<string, string> = {
  scheduled: '대기',
  playing: '진행',
  paused: '일시중지',
  finished: '종료',
};

export default function AdminResultsPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [showFinished, setShowFinished] = useState(false);
  const [finishedQuery, setFinishedQuery] = useState('');
  const [message, setMessage] = useState('');

  const selectedMatch = useMemo(() => matches.find((match) => match.id === selectedMatchId), [matches, selectedMatchId]);
  const activeMatches = useMemo(() => matches.filter((match) => match.status !== 'finished'), [matches]);
  const finishedMatches = useMemo(() => {
    const query = finishedQuery.trim().toLowerCase();
    return matches.filter((match) => {
      if (match.status !== 'finished') return false;
      if (!query) return true;
      const haystack = [
        `r${match.round_no}`,
        `${match.match_no}`,
        `${match.court_no || ''}`,
        match.court_name || '',
        ...match.team_a_names,
        ...match.team_b_names,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [finishedQuery, matches]);

  async function loadData(eventId = selectedEventId) {
    const url = eventId ? `/api/admin/results?event_id=${encodeURIComponent(eventId)}` : '/api/admin/results';
    const response = await fetch(url, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) {
      setMessage(`결과 정보 조회 실패: ${result.error || '서버 오류'}`);
      return;
    }
    const loadedMatches = result.matches || [];
    setEvents(result.events || []);
    setSelectedEventId(result.selected_event_id || '');
    setMatches(loadedMatches);
    const nextMatch = loadedMatches.find((match: MatchView) => match.status !== 'finished');
    if (nextMatch) chooseMatchFromList(nextMatch, loadedMatches);
    else {
      setSelectedMatchId('');
      setTeamAScore(0);
      setTeamBScore(0);
    }
  }

  useEffect(() => {
    const initialEventId = new URLSearchParams(window.location.search).get('event_id') || window.localStorage.getItem('75rabbit_admin_event_id') || '';
    loadData(initialEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseMatchFromList(match: MatchView, list = matches) {
    const target = list.find((item) => item.id === match.id) || match;
    setSelectedMatchId(target.id);
    setTeamAScore(target.team_a_score || 0);
    setTeamBScore(target.team_b_score || 0);
  }

  function chooseMatch(matchId: string) {
    const match = matches.find((item) => item.id === matchId);
    if (match) chooseMatchFromList(match);
  }

  async function saveResult(finish: boolean) {
    if (!selectedMatchId) {
      setMessage('점수를 입력할 경기를 선택하세요.');
      return;
    }
    const response = await fetch('/api/admin/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: selectedMatchId, team_a_score: teamAScore, team_b_score: teamBScore, finish }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(`결과 저장 실패: ${result.error || '서버 오류'}`);
      return;
    }
    setMessage(finish ? '점수를 저장하고 경기 종료 처리했습니다.' : '점수를 임시 저장했습니다.');
    await loadData(selectedEventId);
  }

  function MatchCard({ match, finished = false }: { match: MatchView; finished?: boolean }) {
    const active = selectedMatchId === match.id;
    return (
      <button
        type="button"
        onClick={() => chooseMatch(match.id)}
        className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
          active ? 'border-gray-900 bg-gray-900 text-white' : finished ? 'border-gray-200 bg-gray-100 text-gray-600' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <b>
            R{match.round_no} - {match.match_no}경기
          </b>
          <span className="badge">{statusLabel[match.status] || match.status}</span>
        </div>
        <p className="mt-1 text-sm font-bold opacity-70">{match.court_name || `${match.court_no || '-'}코트`}</p>
        <div className="mt-3 grid gap-2 text-sm">
          <p>
            <b>A</b> {match.team_a_names.join(' / ') || '-'}
          </p>
          <p>
            <b>B</b> {match.team_b_names.join(' / ') || '-'}
          </p>
        </div>
        {finished && (
          <p className="mt-3 font-black">
            A {match.team_a_score} : {match.team_b_score} B
          </p>
        )}
      </button>
    );
  }

  return (
    <AdminShell title="결과입력">
      <div className="grid gap-6">
        <section className="card">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black">진행 경기 점수 입력</h2>
              <p className="mt-2 text-sm text-gray-600">경기를 select로 고르지 않고, 경기번호/코트번호 블록을 눌러 점수를 입력합니다. 종료된 경기는 기본 목록에서 제외됩니다.</p>
            </div>
            <select className="input md:w-80" value={selectedEventId} onChange={(event) => loadData(event.target.value)}>
              <option value="">모임 선택</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.event_date} · {event.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_420px]">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
              {activeMatches.length === 0 && <p className="rounded-2xl bg-gray-50 p-5 text-gray-600">현재 진행/대기 중인 경기가 없습니다.</p>}
            </div>

            <div className="rounded-3xl border bg-white p-5">
              {selectedMatch ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-500">
                        R{selectedMatch.round_no} - {selectedMatch.match_no}경기 · {selectedMatch.court_name || `${selectedMatch.court_no || '-'}코트`}
                      </p>
                      <h3 className="mt-1 text-xl font-black">점수 입력/수정</h3>
                    </div>
                    <span className="badge">{statusLabel[selectedMatch.status] || selectedMatch.status}</span>
                  </div>
                  <div className="mt-5 grid gap-4">
                    <label className="rounded-2xl bg-blue-50 p-4">
                      <b>A팀</b>
                      <p className="mt-1 min-h-6 text-sm text-gray-600">{selectedMatch.team_a_names.join(' / ') || '-'}</p>
                      <input className="input mt-3 text-2xl font-black" type="number" min={0} step={1} value={teamAScore} onChange={(event) => setTeamAScore(Number(event.target.value))} />
                    </label>
                    <label className="rounded-2xl bg-rose-50 p-4">
                      <b>B팀</b>
                      <p className="mt-1 min-h-6 text-sm text-gray-600">{selectedMatch.team_b_names.join(' / ') || '-'}</p>
                      <input className="input mt-3 text-2xl font-black" type="number" min={0} step={1} value={teamBScore} onChange={(event) => setTeamBScore(Number(event.target.value))} />
                    </label>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button className="rounded-full bg-gray-800 px-5 py-3 text-sm font-bold text-white" type="button" onClick={() => saveResult(false)}>
                      점수 임시 저장
                    </button>
                    <button className="btn" type="button" onClick={() => saveResult(true)}>
                      저장 후 경기 종료
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">선택된 경기가 없습니다.</p>
              )}
            </div>
          </div>
          {message && <p className="mt-4 rounded-xl bg-gray-100 p-3 text-sm font-bold">{message}</p>}
        </section>

        <section className="card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">종료 경기 검색/수정</h2>
              <p className="mt-1 text-sm text-gray-600">별도 버튼으로 종료 경기 목록을 열고, 경기번호/선수명/코트번호로 검색해 점수를 수정할 수 있습니다.</p>
            </div>
            <button className="rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white" type="button" onClick={() => setShowFinished((value) => !value)}>
              {showFinished ? '종료 경기 닫기' : '종료 경기 보기'}
            </button>
          </div>
          {showFinished && (
            <>
              <input className="input mt-4" value={finishedQuery} onChange={(event) => setFinishedQuery(event.target.value)} placeholder="경기번호, 선수 이름, 코트번호 검색" />
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {finishedMatches.map((match) => (
                  <MatchCard key={match.id} match={match} finished />
                ))}
                {finishedMatches.length === 0 && <p className="rounded-2xl bg-gray-50 p-5 text-gray-600">검색된 종료 경기가 없습니다.</p>}
              </div>
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
