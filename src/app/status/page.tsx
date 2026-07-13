import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getParticipantEventSession } from '@/lib/event-session';
import { getServerSupabase } from '@/lib/supabase/server';

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
        <h1 className="text-2xl font-black">참가 현황</h1>
        <p className="mt-2 text-sm text-gray-600">현재 모임의 참가 신청 목록입니다.</p>
        <div className="mt-5 grid gap-3">
          {(data || []).map((row: any) => (
            <div key={row.id} className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <b>{row.members?.name}</b>
                <span className="badge">{row.status}</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {row.members?.gender === 'M' ? '남자' : '여자'} · {row.members?.level || '-'} · {row.play_type || 'random'}
              </p>
              {row.partner_name && <p className="mt-1 text-sm text-gray-500">희망파트너: {row.partner_name}</p>}
            </div>
          ))}
          {(!data || data.length === 0) && <p className="text-gray-500">신청자가 없습니다.</p>}
        </div>
      </section>
    </AppShell>
  );
}
