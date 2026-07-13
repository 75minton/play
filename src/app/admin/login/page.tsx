'use client';

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
      body: JSON.stringify({ username: String(form.get('username') || ''), password: String(form.get('password') || '') })
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
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <section className="card w-full">
        <h1 className="text-3xl font-black">관리자 로그인</h1>
        <p className="mt-2 text-sm text-gray-600">관리자 아이디와 비밀번호를 입력하세요.</p>
        <form onSubmit={login} className="mt-6 grid gap-4">
          <input className="input" name="username" type="text" placeholder="관리자 아이디" required autoComplete="username" />
          <input className="input" name="password" type="password" placeholder="관리자 비밀번호" required autoComplete="current-password" />
          <button className="btn" disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>
        </form>
        {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
        <LinkHome />
      </section>
    </main>
  );
}

function LinkHome() {
  return <a href="/" className="mt-5 block text-center text-sm font-bold text-gray-500">← 참석자 화면</a>;
}
