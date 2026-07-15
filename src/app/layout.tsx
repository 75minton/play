import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: '75Rabbit 배드민턴 모임',
  description: '배드민턴 모임 생성, 참가 신청, 대진표, 전광판, 결과 관리 웹앱',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: '75Rabbit',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#111827',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
