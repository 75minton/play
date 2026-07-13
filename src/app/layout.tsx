import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '75Rabbit 배드민턴 모임',
  description: '배드민턴 운동 모임 생성, 참가 신청, 대진표, 결과 관리 웹프로그램',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
