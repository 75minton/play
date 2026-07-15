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

type MemberOption = {
  id: string;
  name: string;
  gender: 'M' | 'F' | null;
  level: string | null;
};

type CourtOption = {
  id: string;
  court_no: number;
  name: string | null;
};

type MatchPlayer = {
  member_id: string;
  name: string;
  level: string | null;
  position_no: number;
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
  team_a_players: MatchPlayer[];
  team_b_players: MatchPlayer[];
};

const statusLabel: Record<string, string> = {
  scheduled: '대기',
  playing: '진행',
  paused: '일시중지',
  finished: '종료',
};

export default function AdminMatchesPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eligiblePlayerCount, setEligiblePlayerCount] = useState(0);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [message, setMessage] = useState('');
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId), [events, selectedEventId]);
  const selectedMatch = useMemo(() => matches.find((match) => match.id === selectedMatchId), [matches, selectedMatchId]);

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
    setMembers(result.available_members || []);
    setCourts(result.courts || []);
    setMatches(result.matches || []);
    if (!selectedMatchId && result.matches?.[0]) setSelectedMatchId(result.matches[0].id);
  }

  useEffect(() => {
    const initialEventId = new URLSearchParams(window.location.search).get('event_id') || window.localStorage.getItem('75rabbit_admin_event_id') || '';
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

  async function updateMatch(formData: FormData) {
    if (!selectedMatch) return;
    const replacements = ['A-1', 'A-2', 'B-1', 'B-2'].map((key) => {
      const [team, position] = key.split('-');
      return { team, position_no: Number(position), member_id: String(formData.get(`member_${key}`) || '') };
    });
    const response = await fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id: selectedMatch.id,
        round_no: Number(formData.get('round_no')),
        match_no: Number(formData.get('match_no')),
        court_id: String(formData.get('court_id') || ''),
        status: String(formData.get('status') || 'scheduled'),
        replacements,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(`경기 수정 실패: ${result.error || '서버 오류'}`);
      return;
    }
    setMessage('경기 정보와 멤버 구성을 수정했습니다.');
    await loadData(selectedEventId);
  }

  async function deleteMatch(matchId: string) {
    if (!window.confirm('선택한 경기를 삭제할까요?')) return;
    const response = await fetch(`/api/admin/matches?match_id=${encodeURIComponent(matchId)}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      setMessage(`경기 삭제 실패: ${result.error || '서버 오류'}`);
      return;
    }
    setMessage('경기를 삭제했습니다.');
    setSelectedMatchId('');
    await loadData(selectedEventId);
  }

  function playerSelectName(team: 'A' | 'B', position: number) {
    const list = team === 'A' ? selectedMatch?.team_a_players : selectedMatch?.team_b_players;
    return list?.find((player) => player.position_no === position)?.member_id || '';
  }

  return (
    <AdminShell title="대진관리">
      <div className="grid gap-6">
        <section className="card">
          <h2 className="text-xl font-black">대진 생성</h2>
          <p className="mt-2 text-sm text-gray-600">
            시작 라운드 번호와 생성할 경기 수를 입력하세요. 기존 대진을 삭제하지 않고 추가 생성하면, 이미 경기 배정이 적은 선수가 우선 배정됩니다.
          </p>
          <form action={createMatches} className="mt-5 grid gap-4 md:grid-cols-4">
            <select className="input md:col-span-2" name="event_id" value={selectedEventId} onChange={(event) => loadData(event.target.value)} required>
              <option value="">모임 선택</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.event_date} · {event.title}
                </option>
              ))}
            </select>
            <input className="input" name="round_no" type="number" min={1} step={1} defaultValue={1} placeholder="시작 라운드 번호" />
            <input className="input" name="match_count" type="number" min={1} step={1} placeholder="생성 경기 수" defaultValue={selectedEvent?.match_count || ''} key={`match-count-${selectedEventId}`} />
            <label className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold md:col-span-4">
              <input name="replace_existing" type="checkbox" />
              기존 대진을 삭제하고 새로 생성
            </label>
            <button className="btn md:col-span-4">선택한 모임의 대진 생성/추가</button>
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

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">생성된 대진 목록</h2>
              <button className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold" onClick={() => loadData()} type="button">
                새로고침
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              {matches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => setSelectedMatchId(match.id)}
                  className={`rounded-2xl border p-4 text-left ${selectedMatchId === match.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <b>
                      R{match.round_no} - {match.match_no}경기
                    </b>
                    <span className="badge">{statusLabel[match.status] || match.status}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold opacity-70">{match.court_name || `${match.court_no || '-'}코트`}</p>
                  <div className="mt-2 grid gap-1 text-sm">
                    <p>A팀 {match.team_a_names.join(' / ') || '-'}</p>
                    <p>B팀 {match.team_b_names.join(' / ') || '-'}</p>
                  </div>
                </button>
              ))}
              {matches.length === 0 && <p className="py-8 text-center text-gray-500">생성된 대진이 없습니다.</p>}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-black">대진 수정 / 멤버 교체</h2>
            {selectedMatch ? (
              <form action={updateMatch} className="mt-4 grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-bold">
                    라운드
                    <input className="input mt-1" name="round_no" type="number" min={1} defaultValue={selectedMatch.round_no} key={`round-${selectedMatch.id}`} />
                  </label>
                  <label className="text-sm font-bold">
                    경기번호
                    <input className="input mt-1" name="match_no" type="number" min={1} defaultValue={selectedMatch.match_no} key={`match-${selectedMatch.id}`} />
                  </label>
                </div>
                <label className="text-sm font-bold">
                  코트
                  <select className="input mt-1" name="court_id" defaultValue={courts.find((court) => court.court_no === selectedMatch.court_no)?.id || ''} key={`court-${selectedMatch.id}`}>
                    <option value="">코트 미배정</option>
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name || `${court.court_no}코트`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  상태
                  <select className="input mt-1" name="status" defaultValue={selectedMatch.status} key={`status-${selectedMatch.id}`}>
                    <option value="scheduled">대기</option>
                    <option value="playing">진행</option>
                    <option value="paused">일시중지</option>
                    <option value="finished">종료</option>
                  </select>
                </label>
                <div className="grid gap-3">
                  {(['A', 'B'] as const).map((team) =>
                    ([1, 2] as const).map((position) => (
                      <label key={`${team}-${position}-${selectedMatch.id}`} className="text-sm font-bold">
                        {team}팀 {position}번 선수
                        <select className="input mt-1" name={`member_${team}-${position}`} defaultValue={playerSelectName(team, position)}>
                          <option value="">선수 선택</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} {member.level || ''}
                            </option>
                          ))}
                        </select>
                      </label>
                    )),
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="btn" type="submit">
                    수정 저장
                  </button>
                  <button className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white" type="button" onClick={() => deleteMatch(selectedMatch.id)}>
                    경기 삭제
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-4 text-gray-600">수정할 경기를 선택하세요.</p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
