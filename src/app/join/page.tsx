'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';

const levels = ['E조', 'D조', 'C조', 'B조', 'A조', 'S조'];

export default function JoinPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);

    const name = String(formData.get('name') || '').trim();
    const gender = String(formData.get('gender') || '').trim();
    const level = String(formData.get('level') || '').trim();
    const phoneLast4 = String(formData.get('phone_last4') || '').trim();
    const playType = String(formData.get('play_type') || 'random');
    const partnerMaleName = String(formData.get('partner_male_name') || '').trim();
    const partnerFemaleName = String(formData.get('partner_female_name') || '').trim();
    const memo = String(formData.get('memo') || '').trim();

    if (!name || !phoneLast4 || !level) {
      setMessage('이름, 급수, 휴대폰 끝 4자리는 필수입니다.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gender, level, phone_last4: phoneLast4, play_type: playType, partner_male_name: partnerMaleName, partner_female_name: partnerFemaleName, memo }),
      });
      const result = await response.json();
      setSuccess(response.ok);
      setMessage(response.ok ? '참가 신청이 완료되었습니다. 같은 정보로 다시 신청하면 기존 신청이 업데이트됩니다.' : result.error || '참가 신청 중 오류가 발생했습니다.');
    } catch {
      setMessage('네트워크 연결을 확인하고 다시 시도하세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="card mx-auto max-w-3xl">
        <div className="flex flex-col gap-2">
          <span className="badge">참가신청</span>
          <h1 className="section-title">모임 참가 정보 등록</h1>
          <p className="helper-text">{eventTitle ? `${eventTitle} 모임에 참가 신청합니다.` : '로그인된 모임 정보를 확인하고 있습니다.'}</p>
        </div>
        <form action={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="font-bold">
              이름
              <input className="input mt-2" name="name" placeholder="예: 홍길동" required />
            </label>
            <label className="font-bold">
              휴대폰 끝 4자리
              <input className="input mt-2" name="phone_last4" inputMode="numeric" placeholder="1234" maxLength={4} required />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="font-bold">
              성별
              <select className="input mt-2" name="gender" defaultValue="M">
                <option value="M">남자</option>
                <option value="F">여자</option>
              </select>
            </label>
            <label className="font-bold">
              급수
              <select className="input mt-2" name="level" defaultValue="" required>
                <option value="" disabled>
                  급수 선택
                </option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="font-bold">
            신청 구분
            <select className="input mt-2" name="play_type" defaultValue="random">
              <option value="random">랜덤 매칭</option>
              <option value="mens">남복</option>
              <option value="womens">여복</option>
              <option value="mixed">혼복</option>
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="font-bold">
              희망 남자 파트너
              <input className="input mt-2" name="partner_male_name" placeholder="선택 입력" />
            </label>
            <label className="font-bold">
              희망 여자 파트너
              <input className="input mt-2" name="partner_female_name" placeholder="선택 입력" />
            </label>
          </div>
          <label className="font-bold">
            메모
            <textarea className="input mt-2 min-h-28" name="memo" placeholder="운영자에게 전달할 내용이 있으면 입력하세요." />
          </label>
          <button className="btn btn-success" disabled={loading}>
            {loading ? '신청 중...' : '참가 신청 완료'}
          </button>
        </form>
        {message && <p role="status" className={`mt-4 rounded-2xl border p-3 text-sm font-bold ${success ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-red-100 bg-red-50 text-red-700'}`}>{message}</p>}
      </section>
    </AppShell>
  );
}
