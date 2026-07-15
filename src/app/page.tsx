'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type EventSession = {
  title: string;
  eventDate: string;
  location: string | null;
};

const menuItems = [
  { href: '/join', title: '참가신청', desc: '이름, 급수, 파트너 희망을 등록합니다.', icon: '✍️', primary: true },
  { href: '/draw', title: '대진표 보기', desc: '경기 상태와 선수 배정을 확인합니다.', icon: '🏸' },
  { href: '/scoreboard/view', title: '전광판 보기', desc: '현재 코트별 경기와 대기 경기를 봅니다.', icon: '📺' },
  { href: '/results', title: '결과 확인', desc: '종료된 경기 점수와 승리팀을 확인합니다.', icon: '🏆' },
];

export default function HomePage() {
  const [event, setEvent] = useState<EventSession | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadSession() {
    const response = await fetch('/api/event-session', { cache: 'no-store' });
    const result = await response.json();
    setEvent(result.event || null);
    setLoading(false);
  }

  useEffect(() => {
    loadSession();
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const response = await fetch('/api/event-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_code: accessCode.trim() }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || '모임코드를 확인하세요.');
      return;
    }
    setEvent(result.event);
  }

  async function logout() {
    await fetch('/api/event-session', { method: 'DELETE' });
    setEvent(null);
    setAccessCode('');
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center font-bold">모임 정보를 확인하고 있습니다.</main>;
  }

  if (!event) {
    return (
      <main className="mx-auto grid min-h-screen max-w-5xl items-center px-4 py-10">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="badge">Badminton match manager</span>
            <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight md:text-6xl">
              75Rabbit
              <br />
              모임 경기 운영
            </h1>
            <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-gray-600">
              모임코드 하나로 참가신청, 대진표, 전광판, 결과 확인까지 연결되는 배드민턴 모임 운영 서비스입니다.
            </p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">모임 입장</h2>
                <p className="mt-1 text-sm text-gray-500">관리자가 안내한 모임코드를 입력하세요.</p>
              </div>
              <Link href="/admin" className="nav-pill nav-pill-active">
                관리자
              </Link>
            </div>
            <form onSubmit={login} className="mt-6 grid gap-4">
              <input className="input text-center text-xl font-black tracking-[0.25em]" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="모임코드" autoFocus />
              <button className="btn" type="submit">
                모임 입장
              </button>
            </form>
            {message && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-5">
      <header className="mb-5 flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black">75Rabbit</h1>
          <p className="mt-1 text-sm font-bold text-gray-500">
            {event.title} · {event.eventDate} · {event.location || '장소 미정'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={logout} className="nav-pill" type="button">
            모임 변경
          </button>
          <Link href="/admin" className="nav-pill nav-pill-active">
            관리자
          </Link>
        </div>
      </header>

      <section className="card bg-gradient-to-br from-white via-white to-emerald-50">
        <span className="badge">모임 입장 완료</span>
        <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">필요한 메뉴를 선택하세요.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className={`rounded-3xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${item.primary ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'}`}>
              <span className="text-3xl">{item.icon}</span>
              <b className="mt-4 block text-xl">{item.title}</b>
              <p className={`mt-2 text-sm leading-6 ${item.primary ? 'text-white/70' : 'text-gray-500'}`}>{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
