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
      setMessage('모임명, 날짜, 모임 코드는 필수입니다.');
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
    setMessage('모임이 생성되었습니다. 아래 생성된 모임 목록에서 확인하세요.');
    await loadEvents();
  }

  return (
    <AdminShell title="모임 생성/관리">
      <div className="grid gap-6">
        <section className="card">
          <h2 className="text-xl font-black">새 모임 생성</h2>
          <form action={createEvent} className="mt-5 grid gap-4 md:grid-cols-2">
            <input className="input md:col-span-2" name="title" placeholder="모임명" required />
            <input className="input" name="event_date" type="date" required />
            <input className="input" name="location" placeholder="장소" />
            <input className="input" name="start_time" type="time" />
            <input className="input" name="end_time" type="time" />
            <input className="input" name="access_code" placeholder="참가 신청 코드" required />
            <input className="input" name="max_participants" type="number" min={1} step={1} placeholder="정원" defaultValue={40} required />
            <input className="input" name="court_count" type="number" min={1} step={1} placeholder="코트 수" defaultValue={4} required />
            <button className="btn md:col-span-2">모임 생성</button>
          </form>
          {message && <p className="mt-4 rounded-xl bg-gray-100 p-3 text-sm font-bold">{message}</p>}
        </section>

        <section className="card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">생성된 모임 목록</h2>
            <button className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold" onClick={loadEvents} type="button">
              새로고침
            </button>
          </div>
          {loading ? (
            <p className="mt-4 text-gray-600">모임 목록을 불러오는 중입니다.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">모임명</th>
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
                    <tr key={event.id} className="border-b">
                      <td className="p-3 font-bold">{event.title}</td>
                      <td>
                        {event.event_date}
                        <br />
                        <span className="text-gray-500">{event.location || '-'}</span>
                      </td>
                      <td>
                        <span className="badge">{event.status}</span>
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
                      <td className="font-mono">{event.access_code}</td>
                      <td className="space-x-2">
                        <Link className="text-sm font-bold text-blue-700" href={`/admin/settings?event_id=${event.id}`}>
                          설정
                        </Link>
                        <Link className="text-sm font-bold text-blue-700" href={`/admin/matches?event_id=${event.id}`}>
                          대진
                        </Link>
                        <Link className="text-sm font-bold text-blue-700" href={`/admin/results?event_id=${event.id}`}>
                          결과
                        </Link>
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
