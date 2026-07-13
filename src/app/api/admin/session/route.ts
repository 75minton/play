import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, createAdminToken, getAdminSession } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const session = await getAdminSession();
  return NextResponse.json({ authenticated: Boolean(session), username: session?.username, mustChangePassword: session?.mustChangePassword });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const { data, error } = await getServerSupabase().rpc('verify_app_admin', { p_username: username, p_password: password });
  const admin = data?.[0];
  if (error) return NextResponse.json({ error: `관리자 인증 DB 오류: ${error.message}` }, { status: 500 });
  if (!admin) return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  const response = NextResponse.json({ ok: true, mustChangePassword: admin.must_change_password });
  response.cookies.set(ADMIN_COOKIE, createAdminToken({ id: admin.id, username: admin.username, mustChangePassword: admin.must_change_password }), {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
