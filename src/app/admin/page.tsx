import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { Icon, type IconName } from '@/components/Icon';

const cards: { href: string; title: string; desc: string; icon: IconName }[] = [
  { href: '/admin/events', title: '모임관리', desc: '일정, 장소, 모임코드와 기본 정보를 관리합니다.', icon: 'calendar' },
  { href: '/admin/registrations', title: '참가자관리', desc: '신청자 목록을 확인하고 정보를 수정합니다.', icon: 'users' },
  { href: '/admin/matches', title: '대진관리', desc: '대진 생성, 선수 교체와 경기 상태를 관리합니다.', icon: 'shuffle' },
  { href: '/admin/results', title: '결과입력', desc: '진행 경기의 점수를 입력하고 종료 처리합니다.', icon: 'clipboard' },
  { href: '/admin/settings', title: '모임 설정', desc: '코트 수, 목표 경기 수와 운영 상태를 설정합니다.', icon: 'settings' },
  { href: '/scoreboard', title: '전광판', desc: '코트별 현재 경기와 대기 경기를 운영합니다.', icon: 'monitor' },
];

export default function AdminPage() {
  return (
    <AdminShell title="관리자 대시보드">
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="card flex min-h-[180px] flex-col transition hover:-translate-y-1 hover:shadow-xl sm:min-h-[210px]">
            <span className="icon-tile"><Icon name={card.icon} className="h-6 w-6" /></span>
            <div className="mt-auto pt-5"><b className="block text-base sm:text-xl">{card.title}</b><p className="mt-2 text-xs font-medium leading-5 text-gray-600 sm:text-sm sm:leading-6">{card.desc}</p></div>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}
