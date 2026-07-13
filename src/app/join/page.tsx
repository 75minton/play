'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';

const levels = ['E조', 'D조', 'C조', 'B조', 'A조', 'S조'];

export default function JoinPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventTitle, setEventTitle] = useState('');

  useEffect(() => {
    fetch('/api/event-session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => {
        if (!result.authenticated) window.location.href = '/';
        setEventTitle(result.event?.title || '');
      });
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage('');

    const name = String(formData.get('name') || '').trim();
    const gender = String(formData.get('gender') || '').trim();
    const level = String(formData.get('level') || '').trim();
    const phoneLast4 = String(formData.get('phone_last4') || '').trim();
    const playType = String(formData.get('play_type') || 'random');
    const partnerMaleName = String(formData.get('partner_male_name') || '').trim();
    const partnerFemaleName = String(formData.get('partner_female_name') || '').trim();
    const memo = String(formData.get('memo') || '').trim();

    if (!name || !phoneLast4 || !level) {
      setMessage('이름, 급수, 휴대폰 뒤 4자리는 필수입니다.');
      setLoading(false);
      return;
    }

    const response = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gender, level, phone_last4: phoneLast4, play_type: playType, partner_male_name: partnerMaleName, partner_female_name: partnerFemaleName, memo }),
    });
    const result = await response.json();
    setMessage(response.ok ? '참가 신청이 완료되었습니다.' : result.error || '참가 신청 중 오류가 발생했습니다.');
    setLoading(false);
  }

  return (
    <AppShell>
      <section className="card">
        <h1 className="text-2xl font-black">참가신청</h1>
        <p className="mt-2 text-sm text-gray-600">{eventTitle ? `${eventTitle} 모임에 참가 신청합니다.` : '로그인된 모임 정보를 확인하고 있습니다.'}</p>
        <form action={handleSubmit} className="mt-5 grid gap-4">
          <input className="input" name="name" placeholder="이름" required />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" name="gender" defaultValue="M">
              <option value="M">남자</option>
              <option value="F">여자</option>
            </select>
            <select className="input" name="level" defaultValue="" required>
              <option value="" disabled>
                급수 선택
              </option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <input className="input" name="phone_last4" placeholder="휴대폰 뒤 4자리" maxLength={4} required />
          <select className="input" name="play_type" defaultValue="random">
            <option value="random">랜덤</option>
            <option value="mens">남복</option>
            <option value="womens">여복</option>
            <option value="mixed">혼복</option>
          </select>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="input" name="partner_male_name" placeholder="희망 남자 파트너" />
            <input className="input" name="partner_female_name" placeholder="희망 여자 파트너" />
          </div>
          <textarea className="input min-h-24" name="memo" placeholder="메모" />
          <button className="btn" disabled={loading}>
            {loading ? '신청 중...' : '참가신청 완료'}
          </button>
        </form>
        {message && <p className="mt-4 rounded-xl bg-gray-100 p-3 text-sm font-bold">{message}</p>}
      </section>
    </AppShell>
  );
}
