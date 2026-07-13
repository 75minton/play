'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';

type EventOption = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  court_count: number;
  match_count?: number | null;
  status: string;
};

type MatchView = {
  id: string;
  round_no: number;
  match_no: number;
  court_no: number | null;
  court_name: string | null;
  status: string;
  team_a_names: string[];
  team_b_names: string[];
};

export default function AdminMatchesPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eligiblePlayerCount, setEligiblePlayerCount] = useState(0);
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [message, setMessage] = useState('');
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId), [events, selectedEventId]);

  async function loadData(eventId = selectedEventId) {
    const url = eventId ? `/api/admin/matches?event_id=${encodeURIComponent(eventId)}` : '/api/admin/matches';
    const response = await fetch(url, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) {
      setMessage(`대진 정보 조회 실패: ${result.error || '서버 오류'}`);
      return;
    }
    setEvents(result.events || []);
    setSelectedEventId(result.selected_event_id || '');
    setEligiblePlayerCount(result.eligible_player_count || 0);
    setMatches(result.matches || []);
  }

  useEffect(() => {
    const initialEventId = new URLSearchParams(window.location.search).get('event_id') || '';
    loadData(initialEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createMatches(formData: FormData) {
    const eventId = String(formData.get('event_id') || '').trim();
    const roundNo = Number(formData.get('round_no') || 1);
    const matchCount = Number(formData.get('match_count') || 0);
    const replaceExisting = formData.get('replace_existing') === 'on';

    if (!eventId) {
      setMessage('대진을 생성할 모임을 선택하세요.');
      return;
    }

    const response = await fetch('/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, round_no: roundNo, match_count: matchCount, replace_existing: replaceExisting }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(`대진 생성 실패: ${result.error || '서버 오류'}`);
      return;
    }
    setMessage(`${result.count}개의 경기를 생성했습니다.`);
    await loadData(eventId);
  }

  return (
    <AdminShell title="대진관리">
      <div className="grid gap-6">
        <section className="card">
          <h2 className="text-xl font-black">대진 생성</h2>
          <p className="mt-2 text-sm text-gray-600">
            모임을 선택한 뒤 참가 신청/체크인 인원을 기준으로 복식 경기를 생성합니다. 지정 경기수를 비우면 가능한 1회전 경기만 생성합니다.
          </p>
          <form action={createMatches} className="mt-5 grid gap-4 md:grid-cols-4">
            <select
              className="input md:col-span-2"
              name="event_id"
              value={selectedEventId}
              onChange={(event) => loadData(event.target.value)}
              required
            >
              <option value="">모임 선택</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.event_date} · {event.title}
                </option>
              ))}
            </select>
            <input className="input" name="round_no" type="number" min={1} step={1} defaultValue={1} placeholder="시작 라운드" />
            <input
              className="input"
              name="match_count"
              type="number"
              min={1}
              step={1}
              placeholder="지정 경기수"
              defaultValue={selectedEvent?.match_count || ''}
              key={`match-count-${selectedEventId}`}
            />
            <label className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold md:col-span-4">
              <input name="replace_existing" type="checkbox" />
              기존 대진을 삭제하고 새로 생성
            </label>
            <button className="btn md:col-span-4">선택한 모임의 대진 생성</button>
          </form>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4">
              <b>선택 모임</b>
              <p className="mt-1 text-gray-600">{selectedEvent ? `${selectedEvent.title} (${selectedEvent.event_date})` : '선택 안 됨'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <b>대진 대상 인원</b>
              <p className="mt-1 text-gray-600">{eligiblePlayerCount}명</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <b>코트 수</b>
              <p className="mt-1 text-gray-600">{selectedEvent?.court_count || 0}개</p>
            </div>
          </div>
          {message && <p className="mt-4 rounded-xl bg-gray-100 p-3 text-sm font-bold">{message}</p>}
        </section>

        <section className="card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">생성된 대진 목록</h2>
            <button className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold" onClick={() => loadData()} type="button">
              새로고침
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">경기</th>
                  <th>코트</th>
                  <th>A팀</th>
                  <th>B팀</th>
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
                      <span className="badge">{match.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {matches.length === 0 && <p className="py-8 text-center text-gray-500">생성된 대진이 없습니다.</p>}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
