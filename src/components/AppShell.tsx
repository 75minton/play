'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon, type IconName } from '@/components/Icon';

const navItems: { href: string; label: string; icon: IconName }[] = [
  { href: '/join', label: '참가신청', icon: 'clipboard' },
  { href: '/draw', label: '대진표', icon: 'shuffle' },
  { href: '/scoreboard/view', label: '전광판', icon: 'monitor' },
  { href: '/results', label: '결과', icon: 'trophy' },
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
    const controller = new AbortController();
    fetch('/api/event-session', { cache: 'no-store', signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('세션 조회 실패'))))
      .then((result) => setEvent(result.event || null))
      .catch((error) => {
        if (error.name !== 'AbortError') setEvent(null);
      });
    return () => controller.abort();
  }, []);

  async function changeEvent() {
    await fetch('/api/event-session', { method: 'DELETE' });
    window.location.href = '/';
  }

  return (
    <main className="safe-bottom mx-auto min-h-screen w-full max-w-6xl px-3 pt-3 sm:px-5 sm:pt-5">
      <header className="surface-header mb-4 p-3 sm:mb-6 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-w-0 items-center gap-2.5" aria-label="75Rabbit 홈">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#10221c] text-sm font-black text-white shadow-sm">75</span>
            <span className="min-w-0">
              <span className="block text-lg font-black tracking-[-0.04em] sm:text-xl">75Rabbit</span>
              {event && <span className="block max-w-[48vw] truncate text-xs font-bold text-gray-500 sm:max-w-md">{event.title}</span>}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {event && (
              <button onClick={changeEvent} className="nav-pill hidden sm:inline-flex" type="button">
                모임 변경
              </button>
            )}
            <Link href="/admin" className="nav-pill nav-pill-active gap-1.5" aria-label="관리자 로그인">
              <Icon name="lock" className="h-4 w-4" />
              <span className="hidden min-[390px]:inline">관리자</span>
            </Link>
          </div>
        </div>
        {event && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs font-bold text-gray-500 sm:text-sm">
            <p className="min-w-0 truncate">
              {event.eventDate} <span className="mx-1 text-gray-300">·</span> {event.location || '장소 미정'}
            </p>
            <button onClick={changeEvent} className="shrink-0 font-black text-emerald-700 sm:hidden" type="button">모임 변경</button>
          </div>
        )}
      </header>

      {children}

      <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/80 bg-white/95 px-2 pt-2 shadow-[0_-12px_35px_rgba(16,34,28,0.10)] backdrop-blur-xl md:hidden" aria-label="주요 메뉴">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-[58px] flex-col items-center justify-center rounded-2xl px-1 text-[0.7rem] font-extrabold transition ${active ? 'bg-[#10221c] text-white' : 'text-gray-500 active:bg-gray-100'}`}>
                <Icon name={item.icon} className="mb-1 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <nav className="mb-1 mt-6 hidden items-center justify-center gap-2 md:flex" aria-label="주요 메뉴">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`nav-pill gap-2 ${active ? 'nav-pill-active' : ''}`}>
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
