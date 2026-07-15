import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getParticipantEventSession } from '@/lib/event-session';
import { getServerSupabase } from '@/lib/supabase/server';

const statusLabel: Record<string, string> = {
  applied: '신청',
  checked_in: '체크인',
  waitlisted: '대기',
  canceled: '취소',
};

const playTypeLabel: Record<string, string> = {
  random: '랜덤',
  mens: '남복',
  womens: '여복',
  mixed: '혼복',
};

export default async function StatusPage() {
  const session = await getParticipantEventSession();
  if (!session) redirect('/');

  const { data } = await getServerSupabase()
    .from('registrations')
    .select('id,status,play_type,partner_name,members(name,gender,level),events(title,event_date,location)')
    .eq('event_id', session.eventId)
    .order('created_at', { ascending: true })
    .limit(200);

  return (
    <AppShell>
      <section className="card">
        <span className="badge">참가현황</span>
        <h1 className="section-title mt-3">참가 신청 목록</h1>
        <p className="helper-text mt-2">현재 모임에 신청된 참가자 정보를 확인합니다.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {(data || []).map((row: any) => (
            <div key={row.id} className="rounded-3xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <b className="text-lg">{row.members?.name}</b>
                <span className="badge">{statusLabel[row.status] || row.status}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {row.members?.gender === 'M' ? '남자' : '여자'} · {row.members?.level || '-'} · {playTypeLabel[row.play_type] || row.play_type || '랜덤'}
              </p>
              {row.partner_name && <p className="mt-2 text-sm font-bold text-gray-500">희망 파트너: {row.partner_name}</p>}
            </div>
          ))}
          {(!data || data.length === 0) && <p className="rounded-3xl bg-gray-50 p-8 text-center font-bold text-gray-500 md:col-span-2">신청자가 없습니다.</p>}
        </div>
      </section>
    </AppShell>
  );
}
