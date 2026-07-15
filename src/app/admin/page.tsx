import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';

const cards = [
  { href: '/admin/events', title: '모임관리', desc: '모임 생성, 날짜, 장소, 모임코드, 코트 수를 관리합니다.', icon: '📅' },
  { href: '/admin/registrations', title: '참가자관리', desc: '참가 신청자 목록을 확인하고 정보를 수정합니다.', icon: '👥' },
  { href: '/admin/matches', title: '대진관리', desc: '대진 생성, 경기 수정, 멤버 교체, 경기 삭제를 처리합니다.', icon: '🏸' },
  { href: '/admin/results', title: '결과입력', desc: '진행 경기 점수 입력과 종료 경기 점수 수정을 처리합니다.', icon: '📝' },
  { href: '/admin/settings', title: '설정', desc: '선택된 모임의 코트 수, 목표 경기 수, 상태를 조정합니다.', icon: '⚙️' },
  { href: '/scoreboard', title: '전광판', desc: '코트별 현재 경기와 대기 경기를 실시간으로 확인합니다.', icon: '📺' },
];

export default function AdminPage() {
  return (
    <AdminShell title="관리자 대시보드">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="card transition hover:-translate-y-1 hover:shadow-xl">
            <span className="text-3xl">{card.icon}</span>
            <b className="mt-4 block text-xl">{card.title}</b>
            <p className="mt-2 text-sm leading-6 text-gray-600">{card.desc}</p>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}
