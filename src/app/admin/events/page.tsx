'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';

type EventSummary = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  access_code: string;
  max_participants: number;
  court_count: number;
  status: string;
  registration_count: number;
  checked_in_count: number;
  match_count: number;
  finished_match_count: number;
};

const statusLabel: Record<string, string> = {
  open: '신청가능',
  closed: '신청마감',
  running: '진행중',
  finished: '종료',
};

export default function AdminEventsPage() {
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadEvents() {
    setLoading(true);
    const response = await fetch('/api/admin/events', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) {
      setMessage(`모임 목록 조회 실패: ${result.error || '서버 오류'}`);
      setLoading(false);
      return;
    }
    setEvents(result.events || []);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function createEvent(formData: FormData) {
    const courtCount = Number(formData.get('court_count') || 4);
    const title = String(formData.get('title') || '').trim();
    const eventDate = String(formData.get('event_date') || '');
    const accessCode = String(formData.get('access_code') || '').trim();
    const maxParticipants = Number(formData.get('max_participants') || 40);

    if (!title || !eventDate || !accessCode) {
      setMessage('모임명, 날짜, 모임코드는 필수입니다.');
      return;
    }
    if (!Number.isInteger(courtCount) || courtCount < 1 || !Number.isInteger(maxParticipants) || maxParticipants < 1) {
      setMessage('정원과 코트 수는 1 이상의 정수로 입력하세요.');
      return;
    }

    const response = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        event_date: eventDate,
        location: String(formData.get('location') || ''),
        start_time: String(formData.get('start_time') || ''),
        end_time: String(formData.get('end_time') || ''),
        access_code: accessCode,
        max_participants: maxParticipants,
        court_count: courtCount,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(`모임 생성 실패: ${result.error || '서버 오류'}`);
      return;
    }
    setMessage('모임을 생성했습니다. 목록에서 설정, 대진, 결과 메뉴로 이동할 수 있습니다.');
    await loadEvents();
  }

  return (
    <AdminShell title="모임관리">
      <div className="grid gap-6">
        <section className="card">
          <div>
            <span className="badge">New event</span>
            <h2 className="section-title mt-3">새 모임 생성</h2>
            <p className="helper-text mt-2">참가자가 입력할 모임코드와 경기 운영에 필요한 기본 정보를 등록합니다.</p>
          </div>
          <form action={createEvent} className="mt-6 grid gap-4 md:grid-cols-2">
            <input className="input md:col-span-2" name="title" placeholder="모임명" required />
            <input className="input" name="event_date" type="date" required />
            <input className="input" name="location" placeholder="장소" />
            <input className="input" name="start_time" type="time" />
            <input className="input" name="end_time" type="time" />
            <input className="input" name="access_code" placeholder="모임코드" required />
            <input className="input" name="max_participants" type="number" min={1} step={1} placeholder="정원" defaultValue={40} required />
            <input className="input" name="court_count" type="number" min={1} step={1} placeholder="코트 수" defaultValue={4} required />
            <button className="btn md:col-span-2">모임 생성</button>
          </form>
          {message && <p className="mt-4 rounded-2xl bg-gray-100 p-3 text-sm font-bold">{message}</p>}
        </section>

        <section className="card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="section-title">생성된 모임</h2>
              <p className="helper-text mt-1">운영할 모임을 선택해 설정, 대진, 결과 입력으로 이동하세요.</p>
            </div>
            <button className="nav-pill" onClick={loadEvents} type="button">
              새로고침
            </button>
          </div>
          {loading ? (
            <p className="mt-4 text-gray-600">모임 목록을 불러오는 중입니다.</p>
          ) : (
            <div className="table-wrap mt-5">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>모임</th>
                    <th>날짜/장소</th>
                    <th>상태</th>
                    <th>참가</th>
                    <th>코트</th>
                    <th>대진</th>
                    <th>코드</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="font-bold">{event.title}</td>
                      <td>
                        {event.event_date}
                        <br />
                        <span className="text-gray-500">{event.location || '-'}</span>
                      </td>
                      <td>
                        <span className="badge">{statusLabel[event.status] || event.status}</span>
                      </td>
                      <td>
                        {event.registration_count}/{event.max_participants}
                        <br />
                        <span className="text-gray-500">체크인 {event.checked_in_count}</span>
                      </td>
                      <td>{event.court_count}개</td>
                      <td>
                        {event.finished_match_count}/{event.match_count}
                        <br />
                        <span className="text-gray-500">종료/전체</span>
                      </td>
                      <td className="font-mono font-bold">{event.access_code}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Link className="text-sm font-black text-blue-700" href={`/admin/settings?event_id=${event.id}`}>
                            설정
                          </Link>
                          <Link className="text-sm font-black text-blue-700" href={`/admin/matches?event_id=${event.id}`}>
                            대진
                          </Link>
                          <Link className="text-sm font-black text-blue-700" href={`/admin/results?event_id=${event.id}`}>
                            결과
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && <p className="py-8 text-center text-gray-500">생성된 모임이 없습니다.</p>}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
