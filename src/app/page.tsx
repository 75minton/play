'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type EventSession = {
  title: string;
  eventDate: string;
  location: string | null;
};

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
      body: JSON.stringify({ access_code: accessCode }),
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
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="card">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black">75Rabbit</h1>
            <Link href="/admin" className="rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white">
              관리자
            </Link>
          </div>
          <p className="mt-3 text-gray-600">모임코드를 입력하면 해당 모임의 참가신청, 대진표, 전광판, 결과를 확인할 수 있습니다.</p>
          <form onSubmit={login} className="mt-6 grid gap-4">
            <input className="input text-center text-xl font-black tracking-widest" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="모임코드 입력" autoFocus />
            <button className="btn" type="submit">
              모임 입장
            </button>
          </form>
          {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">75Rabbit</h1>
          <p className="mt-1 text-sm font-bold text-gray-500">
            {event.title} · {event.eventDate} · {event.location || '장소 미지정'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={logout} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-800" type="button">
            모임변경
          </button>
          <Link href="/admin" className="rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white">
            관리자
          </Link>
        </div>
      </header>
      <section className="card bg-gradient-to-br from-white to-gray-100">
        <span className="badge">모임 입장 완료</span>
        <h2 className="mt-4 text-3xl font-black leading-tight">원하는 메뉴를 선택하세요.</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Link className="btn" href="/join">
            참가신청
          </Link>
          <Link className="btn btn-secondary" href="/draw">
            대진표 보기
          </Link>
          <Link className="btn btn-secondary" href="/scoreboard/view">
            전광판 보기
          </Link>
          <Link className="btn btn-secondary" href="/results">
            결과 확인
          </Link>
        </div>
      </section>
    </main>
  );
}
