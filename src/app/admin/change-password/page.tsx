'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get('newPassword') || '');
    const confirmation = String(form.get('confirmation') || '');
    if (newPassword !== confirmation) {
      setMessage('새 비밀번호와 확인 값이 일치하지 않습니다.');
      setLoading(false);
      return;
    }
    const response = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: form.get('currentPassword'), newPassword }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || '비밀번호 변경에 실패했습니다.');
      setLoading(false);
      return;
    }
    router.replace('/admin');
    router.refresh();
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-md items-center px-4 py-10">
      <section className="card w-full">
        <span className="badge">Security</span>
        <h1 className="mt-4 text-3xl font-black">비밀번호 변경</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">초기 비밀번호로 로그인한 경우, 운영 전 반드시 새 비밀번호로 변경해야 합니다.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <input className="input" name="currentPassword" type="password" placeholder="현재 비밀번호" required />
          <input className="input" name="newPassword" type="password" placeholder="새 비밀번호 (8자 이상)" minLength={8} required />
          <input className="input" name="confirmation" type="password" placeholder="새 비밀번호 확인" minLength={8} required />
          <button className="btn" disabled={loading}>
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
        {message && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
      </section>
    </main>
  );
}
