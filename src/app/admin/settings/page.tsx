'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';

type EventOption = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  access_code: string;
  court_count: number;
  max_participants: number;
  match_count?: number | null;
  status: string;
};

type CourtView = {
  id: string;
  court_no: number;
  name: string | null;
};

export default function AdminSettingsPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [courts, setCourts] = useState<CourtView[]>([]);
  const [existingMatchCount, setExistingMatchCount] = useState(0);
  const [settingsSchemaReady, setSettingsSchemaReady] = useState(true);
  const [message, setMessage] = useState('');
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId), [events, selectedEventId]);

  async function loadData(eventId = selectedEventId) {
    const saved = window.localStorage.getItem('75rabbit_admin_event_id') || '';
    const targetEventId = eventId || saved;
    const response = await fetch(targetEventId ? `/api/admin/settings?event_id=${encodeURIComponent(targetEventId)}` : '/api/admin/settings', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) {
      setMessage(`설정 조회 실패: ${result.error || '서버 오류'}`);
      return;
    }
    setEvents(result.events || []);
    setSelectedEventId(result.selected_event_id || '');
    if (result.selected_event_id) window.localStorage.setItem('75rabbit_admin_event_id', result.selected_event_id);
    setCourts(result.courts || []);
    setExistingMatchCount(result.existing_match_count || 0);
    setSettingsSchemaReady(result.settings_schema_ready !== false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveSettings(formData: FormData) {
    const eventId = String(formData.get('event_id') || '').trim();
    const accessCode = String(formData.get('access_code') || '').trim();
    const courtCount = Number(formData.get('court_count') || 1);
    const matchCount = Number(formData.get('match_count') || 0);
    const maxParticipants = Number(formData.get('max_participants') || 1);
    const status = String(formData.get('status') || 'open');

    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, access_code: accessCode, court_count: courtCount, match_count: matchCount, max_participants: maxParticipants, status }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(`설정 저장 실패: ${result.error || '서버 오류'}`);
      return;
    }
    setMessage(result.warning || '설정을 저장했습니다.');
    await loadData(eventId);
  }

  return (
    <AdminShell title="설정">
      <div className="grid gap-6">
        <section className="card">
          <span className="badge">Event settings</span>
          <h2 className="section-title mt-3">모임별 경기 설정</h2>
          <p className="helper-text mt-2">모임코드, 코트 수, 목표 경기 수, 신청 상태를 관리합니다.</p>
          {!settingsSchemaReady && (
            <p className="mt-4 rounded-2xl bg-yellow-50 p-4 text-sm font-bold text-yellow-900">
              목표 경기 수 저장 컬럼이 DB에 아직 없습니다. Supabase SQL Editor에서 db/event_settings.sql을 실행하면 목표 경기 수도 저장됩니다.
            </p>
          )}
          <form action={saveSettings} className="mt-6 grid gap-4 md:grid-cols-2">
            <select className="input md:col-span-2" name="event_id" value={selectedEventId} onChange={(event) => loadData(event.target.value)} required>
              <option value="">모임 선택</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.event_date} · {event.title}
                </option>
              ))}
            </select>
            <label className="font-bold">
              모임 Code
              <input className="input mt-2" name="access_code" defaultValue={selectedEvent?.access_code || ''} key={`code-${selectedEventId}`} />
            </label>
            <label className="font-bold">
              정원
              <input className="input mt-2" name="max_participants" type="number" min={1} step={1} defaultValue={selectedEvent?.max_participants || 40} key={`max-${selectedEventId}`} />
            </label>
            <label className="font-bold">
              코트 수
              <input className="input mt-2" name="court_count" type="number" min={1} step={1} defaultValue={selectedEvent?.court_count || 4} key={`court-${selectedEventId}`} />
            </label>
            <label className="font-bold">
              목표 경기 수
              <input className="input mt-2" name="match_count" type="number" min={1} step={1} placeholder="예: 12" defaultValue={selectedEvent?.match_count || ''} key={`match-${selectedEventId}`} />
            </label>
            <label className="font-bold md:col-span-2">
              모임 상태
              <select className="input mt-2" name="status" defaultValue={selectedEvent?.status || 'open'} key={`status-${selectedEventId}`}>
                <option value="open">신청가능</option>
                <option value="closed">신청마감</option>
                <option value="running">경기진행중</option>
                <option value="finished">모임종료</option>
              </select>
            </label>
            <button className="btn md:col-span-2">설정 저장</button>
          </form>
          {message && <p className="mt-4 rounded-2xl bg-gray-100 p-3 text-sm font-bold">{message}</p>}
        </section>

        <section className="card">
          <h2 className="section-title">현재 운영 정보</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-gray-50 p-5">
              <b>선택 모임</b>
              <p className="mt-2 text-gray-600">{selectedEvent ? `${selectedEvent.title} (${selectedEvent.event_date})` : '선택 안 됨'}</p>
            </div>
            <div className="rounded-3xl bg-gray-50 p-5">
              <b>생성된 경기</b>
              <p className="mt-2 text-gray-600">{existingMatchCount}경기</p>
            </div>
            <div className="rounded-3xl bg-gray-50 p-5">
              <b>코트 목록</b>
              <p className="mt-2 text-gray-600">{courts.map((court) => court.name || `${court.court_no}코트`).join(', ') || '-'}</p>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
