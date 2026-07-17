'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon, type IconName } from '@/components/Icon';

type EventSession = { title: string; eventDate: string; location: string | null };
const menuItems: { href: string; title: string; desc: string; icon: IconName; tone: string }[] = [
  { href: '/join', title: '참가신청', desc: '급수와 희망 파트너를 등록합니다.', icon: 'clipboard', tone: 'bg-[#10221c] text-white' },
  { href: '/draw', title: '대진표', desc: '경기 순서와 진행 상태를 봅니다.', icon: 'shuffle', tone: 'bg-white text-gray-900' },
  { href: '/scoreboard/view', title: '전광판', desc: '코트별 현재·대기 경기를 봅니다.', icon: 'monitor', tone: 'bg-white text-gray-900' },
  { href: '/results', title: '경기 결과', desc: '종료 경기 점수와 승리팀을 봅니다.', icon: 'trophy', tone: 'bg-white text-gray-900' },
];

export default function HomePage() {
  const [event, setEvent] = useState<EventSession | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/event-session', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() : { event: null })
      .then((result) => setEvent(result.event || null))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!accessCode.trim()) return;
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/event-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: accessCode.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '모임코드를 확인하세요.');
      setEvent(result.event);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '잠시 후 다시 시도하세요.');
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    await fetch('/api/event-session', { method: 'DELETE' });
    setEvent(null);
    setAccessCode('');
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center px-4"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" /><p className="mt-4 font-bold text-gray-600">모임 정보를 확인하고 있습니다.</p></div></main>;
  }

  if (!event) {
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800"><span className="status-dot" />배드민턴 모임 운영을 한곳에서</div>
            <h1 className="mt-5 text-[clamp(2.75rem,9vw,5rem)] font-black leading-[0.96] tracking-[-0.065em] text-[#10221c]">경기에 집중하세요.<br /><span className="text-emerald-600">운영은 간단하게.</span></h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-gray-600 sm:text-lg sm:leading-8">참가신청부터 대진표, 코트 전광판, 결과까지 모임코드 하나로 연결됩니다.</p>
            <div className="mt-6 grid max-w-lg grid-cols-3 gap-2 text-center text-xs font-extrabold text-gray-600 sm:text-sm">
              <div className="rounded-2xl bg-white/75 p-3 shadow-sm"><Icon name="users" className="mx-auto mb-2 h-5 w-5 text-emerald-700" />참가 관리</div>
              <div className="rounded-2xl bg-white/75 p-3 shadow-sm"><Icon name="shuffle" className="mx-auto mb-2 h-5 w-5 text-emerald-700" />대진 운영</div>
              <div className="rounded-2xl bg-white/75 p-3 shadow-sm"><Icon name="monitor" className="mx-auto mb-2 h-5 w-5 text-emerald-700" />실시간 현황</div>
            </div>
          </div>

          <div className="card order-1 w-full border-white/80 lg:order-2">
            <div className="flex items-start justify-between gap-3">
              <div><span className="badge">모임 참가자</span><h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">모임코드로 입장</h2><p className="mt-1.5 text-sm font-medium text-gray-500">관리자에게 받은 코드를 입력하세요.</p></div>
              <Link href="/admin" className="nav-pill gap-1.5"><Icon name="lock" className="h-4 w-4" />관리자</Link>
            </div>
            <form onSubmit={login} className="mt-7 grid gap-3">
              <label className="text-sm font-extrabold text-gray-700">모임코드
                <input className="input mt-2 text-center text-xl font-black uppercase tracking-[0.18em]" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="예: RABBIT75" autoCapitalize="characters" autoComplete="off" autoFocus />
              </label>
              <button className="btn mt-1 gap-2" type="submit" disabled={submitting || !accessCode.trim()}>{submitting ? '확인 중...' : '모임 입장'}<Icon name="arrow-right" className="h-5 w-5" /></button>
            </form>
            {message && <p role="alert" className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-3 py-3 sm:px-5 sm:py-5">
      <header className="surface-header flex items-center justify-between gap-3 p-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#10221c] text-sm font-black text-white">75</span><div className="min-w-0"><h1 className="text-xl font-black tracking-tight">75Rabbit</h1><p className="truncate text-xs font-bold text-gray-500 sm:text-sm">{event.title}</p></div></div>
        <div className="flex shrink-0 gap-2"><button onClick={logout} className="nav-pill" type="button">모임 변경</button><Link href="/admin" className="nav-pill nav-pill-active"><Icon name="lock" className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">관리자</span></Link></div>
      </header>

      <section className="mt-4 overflow-hidden rounded-[24px] bg-[#10221c] p-5 text-white shadow-xl sm:mt-6 sm:rounded-[30px] sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-black text-emerald-950"><Icon name="check" className="h-4 w-4" />모임 입장 완료</span>
        <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] sm:text-4xl">{event.title}</h2>
        <p className="mt-2 text-sm font-semibold text-white/60 sm:text-base">{event.eventDate} · {event.location || '장소 미정'}</p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} className={`group flex min-h-[180px] flex-col rounded-[22px] border border-gray-200/80 p-4 shadow-[0_12px_30px_rgba(16,34,28,0.06)] transition hover:-translate-y-1 hover:shadow-xl sm:min-h-[210px] sm:rounded-[28px] sm:p-6 ${item.tone}`}>
            <span className={`icon-tile ${item.href === '/join' ? '!bg-white/10 !text-emerald-300' : ''}`}><Icon name={item.icon} className="h-6 w-6" /></span>
            <div className="mt-auto"><b className="text-lg font-black sm:text-2xl">{item.title}</b><p className={`mt-1.5 text-xs font-semibold leading-5 sm:text-sm sm:leading-6 ${item.href === '/join' ? 'text-white/60' : 'text-gray-500'}`}>{item.desc}</p></div>
          </Link>
        ))}
      </section>
    </main>
  );
}
