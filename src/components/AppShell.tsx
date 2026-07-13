'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/join', label: '참가신청' },
  { href: '/draw', label: '대진표' },
  { href: '/scoreboard/view', label: '전광판' },
  { href: '/results', label: '결과확인' },
];

type EventSession = {
  title: string;
  eventDate: string;
  location: string | null;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const [event, setEvent] = useState<EventSession | null>(null);

  useEffect(() => {
    fetch('/api/event-session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => setEvent(result.event || null))
      .catch(() => setEvent(null));
  }, []);

  async function changeEvent() {
    await fetch('/api/event-session', { method: 'DELETE' });
    window.location.href = '/';
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6 pb-24">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="text-2xl font-black">
            75Rabbit
          </Link>
          {event && (
            <p className="mt-1 text-sm font-bold text-gray-500">
              {event.title} · {event.eventDate} · {event.location || '장소 미지정'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {event && (
            <button onClick={changeEvent} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-800" type="button">
              모임변경
            </button>
          )}
          <Link href="/admin" className="rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white">
            관리자
          </Link>
        </div>
      </header>
      {children}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-4 gap-1 px-2 py-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl px-2 py-2 text-center text-xs font-bold text-gray-700 hover:bg-gray-100 sm:text-sm">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
