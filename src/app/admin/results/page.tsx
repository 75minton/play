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

export default function AdminResultsPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [message, setMessage] = useState('');
  const selectedMatch = useMemo(() => matches.find((match) => match.id === selectedMatchId), [matches, selectedMatchId]);

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
    const nextMatch = loadedMatches.find((match: MatchView) => match.status !== 'finished') || loadedMatches[0];
    if (nextMatch) {
      setSelectedMatchId(nextMatch.id);
      setTeamAScore(nextMatch.team_a_score || 0);
      setTeamBScore(nextMatch.team_b_score || 0);
    } else {
      setSelectedMatchId('');
      setTeamAScore(0);
      setTeamBScore(0);
    }
  }

  useEffect(() => {
    const initialEventId = new URLSearchParams(window.location.search).get('event_id') || '';
    loadData(initialEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseMatch(matchId: string) {
    const match = matches.find((item) => item.id === matchId);
    setSelectedMatchId(matchId);
    setTeamAScore(match?.team_a_score || 0);
    setTeamBScore(match?.team_b_score || 0);
  }

  async function saveResult(finish: boolean) {
    if (!selectedMatchId) {
      setMessage('결과를 입력할 경기를 선택하세요.');
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

  return (
    <AdminShell title="결과입력">
      <div className="grid gap-6">
        <section className="card">
          <h2 className="text-xl font-black">경기 선택 및 점수 입력</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <select className="input" value={selectedEventId} onChange={(event) => loadData(event.target.value)}>
              <option value="">모임 선택</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.event_date} · {event.title}
                </option>
              ))}
            </select>
            <select className="input" value={selectedMatchId} onChange={(event) => chooseMatch(event.target.value)}>
              <option value="">경기 선택</option>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  R{match.round_no}-{match.match_no} / {match.court_name || `${match.court_no || '-'}코트`} / {match.team_a_names.join('·')} vs{' '}
                  {match.team_b_names.join('·')}
                </option>
              ))}
            </select>
          </div>

          {selectedMatch ? (
            <div className="mt-5 rounded-3xl border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-500">
                    R{selectedMatch.round_no} - {selectedMatch.match_no}경기 · {selectedMatch.court_name || `${selectedMatch.court_no || '-'}코트`}
                  </p>
                  <h3 className="mt-1 text-xl font-black">팀별 점수 입력</h3>
                </div>
                <span className="badge">{selectedMatch.status}</span>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="rounded-2xl bg-gray-50 p-4">
                  <b>A팀</b>
                  <p className="mt-1 min-h-6 text-sm text-gray-600">{selectedMatch.team_a_names.join(' / ') || '-'}</p>
                  <input className="input mt-3" type="number" min={0} step={1} value={teamAScore} onChange={(event) => setTeamAScore(Number(event.target.value))} />
                </label>
                <label className="rounded-2xl bg-gray-50 p-4">
                  <b>B팀</b>
                  <p className="mt-1 min-h-6 text-sm text-gray-600">{selectedMatch.team_b_names.join(' / ') || '-'}</p>
                  <input className="input mt-3" type="number" min={0} step={1} value={teamBScore} onChange={(event) => setTeamBScore(Number(event.target.value))} />
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
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-gray-50 p-4 text-gray-600">선택한 모임에 생성된 대진이 없습니다.</p>
          )}
          {message && <p className="mt-4 rounded-xl bg-gray-100 p-3 text-sm font-bold">{message}</p>}
        </section>

        <section className="card">
          <h2 className="text-xl font-black">경기별 결과 현황</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">경기</th>
                  <th>코트</th>
                  <th>A팀</th>
                  <th>B팀</th>
                  <th>점수</th>
                  <th>승리팀</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id} className="border-b">
                    <td className="p-3 font-bold">
                      R{match.round_no} - {match.match_no}경기
                    </td>
                    <td>{match.court_name || `${match.court_no || '-'}코트`}</td>
                    <td>{match.team_a_names.join(' / ') || '-'}</td>
                    <td>{match.team_b_names.join(' / ') || '-'}</td>
                    <td>
                      A {match.team_a_score} : {match.team_b_score} B
                    </td>
                    <td>{match.winner_team || '-'}</td>
                    <td>
                      <span className="badge">{match.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {matches.length === 0 && <p className="py-8 text-center text-gray-500">표시할 경기가 없습니다.</p>}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
