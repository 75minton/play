import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';

export default function AdminPage() {
  return (
    <AdminShell title="관리자 대시보드">
      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/events" className="card"><b>모임 생성/관리</b><p className="mt-2 text-sm text-gray-600">날짜, 장소, 코트 수, 모임 코드를 관리합니다.</p></Link>
        <Link href="/admin/registrations" className="card"><b>참가자 관리</b><p className="mt-2 text-sm text-gray-600">참가신청, 대기, 체크인을 관리합니다.</p></Link>
        <Link href="/admin/matches" className="card"><b>대진 관리</b><p className="mt-2 text-sm text-gray-600">대진 자동 생성과 수동 수정 기능 영역입니다.</p></Link>
      </section>
    </AdminShell>
  );
}
