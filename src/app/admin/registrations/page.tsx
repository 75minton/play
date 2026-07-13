'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';

const levels = ['E조', 'D조', 'C조', 'B조', 'A조', 'S조'];

type EventOption = { id: string; title: string; event_date: string; location: string | null };
type Registration = {
  id: string;
  status: string;
  play_type: string;
  partner_name: string | null;
  member_id: string;
  members: { id: string; name: string; gender: string; level: string; phone_last4: string; memo: string | null };
};

export default function AdminRegistrationsPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [message, setMessage] = useState('');

  async function loadData(eventId = selectedEventId) {
    const saved = window.localStorage.getItem('75rabbit_admin_event_id') || '';
    const targetEventId = eventId || saved;
    const response = await fetch(targetEventId ? `/api/admin/registrations?event_id=${encodeURIComponent(targetEventId)}` : '/api/admin/registrations', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || '참가자 목록을 불러오지 못했습니다.');
      return;
    }
    setEvents(result.events || []);
    setSelectedEventId(result.selected_event_id || '');
    setRegistrations(result.registrations || []);
    if (result.selected_event_id) window.localStorage.setItem('75rabbit_admin_event_id', result.selected_event_id);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(formData: FormData) {
    if (!selected) return;
    const payload = {
      registration_id: selected.id,
      member_id: selected.members.id,
      name: String(formData.get('name') || '').trim(),
      gender: String(formData.get('gender') || ''),
      level: String(formData.get('level') || ''),
      phone_last4: String(formData.get('phone_last4') || '').trim(),
      play_type: String(formData.get('play_type') || ''),
      partner_name: String(formData.get('partner_name') || '').trim(),
      status: String(formData.get('status') || ''),
      memo: String(formData.get('memo') || '').trim(),
    };
    const response = await fetch('/api/admin/registrations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || '저장 실패');
      return;
    }
    setMessage('참가자 정보를 저장했습니다.');
    setSelected(null);
    await loadData(selectedEventId);
  }

  return (
    <AdminShell title="참가자관리">
      <div className="grid gap-6">
        <section className="card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black">선택 모임 참가자 리스트</h2>
            <select className="input max-w-sm" value={selectedEventId} onChange={(event) => loadData(event.target.value)}>
              <option value="">모임 선택</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.event_date} · {event.title}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">이름</th>
                  <th>성별</th>
                  <th>급수</th>
                  <th>신청구분</th>
                  <th>희망파트너</th>
                  <th>상태</th>
                  <th>연락처</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((row) => (
                  <tr key={row.id} className="cursor-pointer border-b hover:bg-gray-50" onClick={() => setSelected(row)}>
                    <td className="p-3 font-bold text-blue-700">{row.members?.name}</td>
                    <td>{row.members?.gender === 'M' ? '남자' : '여자'}</td>
                    <td>{row.members?.level}</td>
                    <td>{row.play_type}</td>
                    <td>{row.partner_name || '-'}</td>
                    <td><span className="badge">{row.status}</span></td>
                    <td>{row.members?.phone_last4}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registrations.length === 0 && <p className="py-8 text-center text-gray-500">참가자가 없습니다.</p>}
          </div>
          {message && <p className="mt-4 rounded-xl bg-gray-100 p-3 text-sm font-bold">{message}</p>}
        </section>

        {selected && (
          <section className="card">
            <h2 className="text-xl font-black">참가자 정보 수정</h2>
            <form action={save} className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="input" name="name" defaultValue={selected.members.name} placeholder="이름" />
              <input className="input" name="phone_last4" defaultValue={selected.members.phone_last4} placeholder="휴대폰 뒤 4자리" maxLength={4} />
              <select className="input" name="gender" defaultValue={selected.members.gender || 'M'}>
                <option value="M">남자</option>
                <option value="F">여자</option>
              </select>
              <select className="input" name="level" defaultValue={selected.members.level || ''}>
                <option value="">급수 선택</option>
                {levels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
              <select className="input" name="play_type" defaultValue={selected.play_type || 'random'}>
                <option value="random">랜덤</option>
                <option value="mens">남복</option>
                <option value="womens">여복</option>
                <option value="mixed">혼복</option>
              </select>
              <select className="input" name="status" defaultValue={selected.status || 'applied'}>
                <option value="applied">신청</option>
                <option value="checked_in">체크인</option>
                <option value="waitlisted">대기</option>
                <option value="canceled">취소</option>
              </select>
              <input className="input md:col-span-2" name="partner_name" defaultValue={selected.partner_name || ''} placeholder="희망파트너" />
              <textarea className="input min-h-24 md:col-span-2" name="memo" defaultValue={selected.members.memo || ''} placeholder="메모" />
              <button className="btn">저장</button>
              <button className="btn btn-secondary" type="button" onClick={() => setSelected(null)}>취소</button>
            </form>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
