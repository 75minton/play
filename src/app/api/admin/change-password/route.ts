import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, createAdminToken, getAdminSession } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  if (newPassword.length < 8) return NextResponse.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
  if (currentPassword === newPassword) return NextResponse.json({ error: '새 비밀번호는 기존 비밀번호와 달라야 합니다.' }, { status: 400 });
  const { data, error } = await getServerSupabase().rpc('change_app_admin_password', {
    p_admin_id: session.id, p_current_password: currentPassword, p_new_password: newPassword
  });
  if (error || data !== true) return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminToken({ id: session.id, username: session.username, mustChangePassword: false }), {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
