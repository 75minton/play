'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const adminItems = [
  { href: '/admin/events', label: '모임관리' },
  { href: '/admin/registrations', label: '참가자관리' },
  { href: '/admin/matches', label: '대진관리' },
  { href: '/admin/results', label: '결과입력' },
  { href: '/admin/settings', label: '설정' },
  { href: '/scoreboard', label: '전광판' },
  { href: '/', label: '메인홈' },
];

type AdminEvent = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
};

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      const response = await fetch('/api/admin/session', { cache: 'no-store' });
      const session = await response.json();
      if (!session.authenticated) {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (session.mustChangePassword && pathname !== '/admin/change-password') {
        router.replace('/admin/change-password');
        return;
      }
      if (!active) return;
      setAuthorized(true);
      setChecking(false);
    }

    checkAdmin();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!authorized) return;
    fetch('/api/admin/events', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => {
        const loaded = result.events || [];
        setEvents(loaded);
        const saved = window.localStorage.getItem('75rabbit_admin_event_id');
        const nextId = saved && loaded.some((event: AdminEvent) => event.id === saved) ? saved : loaded[0]?.id || '';
        setSelectedEventId(nextId);
      })
      .catch(() => setEvents([]));
  }, [authorized]);

  function changeEvent(eventId: string) {
    setSelectedEventId(eventId);
    window.localStorage.setItem('75rabbit_admin_event_id', eventId);
    const target = pathname.startsWith('/admin') ? pathname : '/admin/events';
    router.push(`${target}?event_id=${encodeURIComponent(eventId)}`);
  }

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.replace('/admin/login');
  }

  const selectedEvent = events.find((event) => event.id === selectedEventId);

  if (checking) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center font-bold">관리자 권한을 확인하고 있습니다.</main>;
  }

  if (!authorized) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black">관리자 권한이 없습니다</h1>
        <p className="mt-3 text-gray-600">서버 관리자 인증이 필요합니다.</p>
        <button className="btn mt-6" onClick={signOut}>
          다른 계정으로 로그인
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-bold text-gray-500">
              참석자 화면
            </Link>
            <h1 className="mt-2 text-3xl font-black">{title}</h1>
            <p className="mt-1 text-sm font-bold text-gray-500">
              현재 모임: {selectedEvent ? `${selectedEvent.title} (${selectedEvent.event_date})` : '선택된 모임 없음'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="input min-w-56" value={selectedEventId} onChange={(event) => changeEvent(event.target.value)}>
              <option value="">모임 선택</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.event_date} · {event.title}
                </option>
              ))}
            </select>
            <button onClick={signOut} className="rounded-full bg-gray-800 px-4 py-2 text-sm font-bold text-white">
              로그아웃
            </button>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {adminItems.map((item) => (
            <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm font-bold shadow-sm ${pathname === item.href ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-100'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </main>
  );
}
