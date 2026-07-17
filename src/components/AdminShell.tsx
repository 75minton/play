'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon, type IconName } from '@/components/Icon';

const adminItems: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin', label: '대시보드', icon: 'dashboard' },
  { href: '/admin/events', label: '모임관리', icon: 'calendar' },
  { href: '/admin/registrations', label: '참가자', icon: 'users' },
  { href: '/admin/matches', label: '대진관리', icon: 'shuffle' },
  { href: '/admin/results', label: '결과입력', icon: 'clipboard' },
  { href: '/admin/settings', label: '설정', icon: 'settings' },
  { href: '/scoreboard', label: '전광판', icon: 'monitor' },
];

type AdminEvent = { id: string; title: string; event_date: string; location: string | null };

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
      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store' });
        const session = await response.json();
        if (!response.ok || !session.authenticated) {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        if (session.mustChangePassword && pathname !== '/admin/change-password') {
          router.replace('/admin/change-password');
          return;
        }
        if (active) setAuthorized(true);
      } finally {
        if (active) setChecking(false);
      }
    }
    checkAdmin();
    return () => { active = false; };
  }, [pathname, router]);

  useEffect(() => {
    if (!authorized) return;
    fetch('/api/admin/events', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('모임 조회 실패'))))
      .then((result) => {
        const loaded = result.events || [];
        setEvents(loaded);
        const queryId = new URLSearchParams(window.location.search).get('event_id');
        const saved = window.localStorage.getItem('75rabbit_admin_event_id');
        const preferred = queryId || saved;
        const nextId = preferred && loaded.some((event: AdminEvent) => event.id === preferred) ? preferred : loaded[0]?.id || '';
        setSelectedEventId(nextId);
        if (nextId) window.localStorage.setItem('75rabbit_admin_event_id', nextId);
      })
      .catch(() => setEvents([]));
  }, [authorized]);

  function changeEvent(eventId: string) {
    setSelectedEventId(eventId);
    window.localStorage.setItem('75rabbit_admin_event_id', eventId);
    window.dispatchEvent(new CustomEvent('75rabbit:event-change', { detail: { eventId } }));
    const params = new URLSearchParams(window.location.search);
    if (eventId) params.set('event_id', eventId); else params.delete('event_id');
    window.location.href = `${pathname}${params.size ? `?${params}` : ''}`;
  }

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.replace('/admin/login');
  }

  const selectedEvent = events.find((event) => event.id === selectedEventId);

  if (checking) {
    return <main className="grid min-h-screen place-items-center px-4"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" /><p className="mt-4 font-bold text-gray-600">관리자 권한을 확인하고 있습니다.</p></div></main>;
  }

  if (!authorized) return null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1500px] px-3 py-3 sm:px-5 sm:py-5">
      <header className="surface-header sticky top-2 z-30 mb-5 overflow-hidden p-3 sm:top-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#10221c] text-[10px] text-white">75</span>
              Admin
            </Link>
            <h1 className="mt-2 truncate text-2xl font-black tracking-[-0.04em] sm:text-3xl">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/" className="nav-pill gap-1.5" aria-label="메인 홈"><Icon name="home" className="h-4 w-4" /><span className="hidden sm:inline">메인 홈</span></Link>
            <button onClick={signOut} className="nav-pill gap-1.5" type="button" aria-label="로그아웃"><Icon name="logout" className="h-4 w-4" /><span className="hidden sm:inline">로그아웃</span></button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 border-t border-gray-100 pt-3 lg:grid-cols-[minmax(240px,360px)_1fr] lg:items-center">
          <label className="relative block">
            <span className="sr-only">현재 모임 선택</span>
            <select className="input h-11 min-h-11 appearance-none pr-10 text-sm font-extrabold" value={selectedEventId} onChange={(event) => changeEvent(event.target.value)}>
              <option value="">모임 선택</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.event_date} · {event.title}</option>)}
            </select>
            <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-gray-400" />
          </label>
          <p className="truncate text-xs font-bold text-gray-500 lg:text-right">{selectedEvent ? `${selectedEvent.title} · ${selectedEvent.event_date}${selectedEvent.location ? ` · ${selectedEvent.location}` : ''}` : '운영할 모임을 선택하세요.'}</p>
        </div>

        <nav className="-mx-3 mt-3 flex gap-1.5 overflow-x-auto border-t border-gray-100 px-3 pt-3 [scrollbar-width:none] sm:-mx-4 sm:px-4" aria-label="관리자 메뉴">
          {adminItems.map((item) => {
            const active = pathname === item.href;
            return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`nav-pill shrink-0 gap-1.5 ${active ? 'nav-pill-active' : ''}`}><Icon name={item.icon} className="h-4 w-4" />{item.label}</Link>;
          })}
        </nav>
      </header>
      {children}
    </main>
  );
}
