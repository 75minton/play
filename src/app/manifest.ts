import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '75Rabbit 배드민턴 모임',
    short_name: '75Rabbit',
    description: '배드민턴 모임 참가, 대진표, 전광판, 결과 확인',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f7fb',
    theme_color: '#111827',
    orientation: 'any',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
