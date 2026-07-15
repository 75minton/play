'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AdminLoginPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const nextPath = new URLSearchParams(window.location.search).get('next') || '/admin';
    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: String(form.get('username') || ''), password: String(form.get('password') || '') }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || '로그인에 실패했습니다.');
      setLoading(false);
      return;
    }
    window.location.href = result.mustChangePassword ? '/admin/change-password' : nextPath;
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-md items-center px-4 py-10">
      <section className="card w-full">
        <span className="badge">Admin</span>
        <h1 className="mt-4 text-3xl font-black">관리자 로그인</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">모임 생성, 참가자 관리, 대진 생성, 점수 입력은 관리자 권한이 필요합니다.</p>
        <form onSubmit={login} className="mt-6 grid gap-4">
          <input className="input" name="username" type="text" placeholder="관리자 ID" required autoComplete="username" />
          <input className="input" name="password" type="password" placeholder="비밀번호" required autoComplete="current-password" />
          <button className="btn" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        {message && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
        <Link href="/" className="mt-5 block text-center text-sm font-bold text-gray-500">
          참가자 화면으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
