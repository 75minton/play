'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/join', label: '참가신청', icon: '✍️' },
  { href: '/draw', label: '대진표', icon: '🏸' },
  { href: '/scoreboard/view', label: '전광판', icon: '📺' },
  { href: '/results', label: '결과', icon: '🏆' },
];

type EventSession = {
  title: string;
  eventDate: string;
  location: string | null;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-5 pb-28">
      <header className="mb-5 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black tracking-tight">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gray-900 text-white">75</span>
              <span>75Rabbit</span>
            </Link>
            {event && (
              <p className="mt-2 truncate text-sm font-bold text-gray-500">
                {event.title} · {event.eventDate} · {event.location || '장소 미정'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {event && (
              <button onClick={changeEvent} className="nav-pill" type="button">
                모임 변경
              </button>
            )}
            <Link href="/admin" className="nav-pill nav-pill-active">
              관리자
            </Link>
          </div>
        </div>
      </header>
      {children}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-4 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`rounded-2xl px-2 py-2.5 text-center text-xs font-black transition sm:text-sm ${active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span className="block text-base leading-none">{item.icon}</span>
                <span className="mt-1 block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
