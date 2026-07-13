-- 75Rabbit Supabase RLS 정책 예시
-- 실제 운영 전 정책을 프로젝트 요구사항에 맞게 재검토하세요.

alter table events enable row level security;
alter table members enable row level security;
alter table registrations enable row level security;
alter table courts enable row level security;
alter table matches enable row level security;
alter table match_players enable row level security;
alter table admins enable row level security;
alter table audit_logs enable row level security;

-- 관리자 여부 확인 함수
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from admins
    where user_id = auth.uid()
    and role in ('owner', 'admin', 'operator')
  );
$$ language sql security definer;

-- 공개 조회: 참석자 화면에서 모임/대진/결과를 볼 수 있도록 허용
create policy "public read events" on events for select using (true);
create policy "public read courts" on courts for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read match players" on match_players for select using (true);
create policy "public read members minimal" on members for select using (true);
create policy "public read registrations" on registrations for select using (true);

-- 참가신청: 비로그인 참석자가 신청 생성 가능하도록 허용
-- 실제 운영에서는 access_code 검증을 API route/server action에서 처리하는 방식을 권장
create policy "public insert members" on members for insert with check (true);
create policy "public insert registrations" on registrations for insert with check (true);

-- 관리자 전체 관리 권한
create policy "admin manage events" on events for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage members" on members for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage registrations" on registrations for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage courts" on courts for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage matches" on matches for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage match players" on match_players for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read admins" on admins for select using (public.is_admin());
create policy "admin read audit logs" on audit_logs for select using (public.is_admin());
create policy "admin insert audit logs" on audit_logs for insert with check (public.is_admin());

-- 주의:
-- 1. members/registrations 공개 select는 MVP 편의용입니다.
-- 2. 운영 시에는 phone_last4 등 민감성이 있는 값은 view를 만들어 최소 공개를 권장합니다.
-- 3. 관리자 생성은 SQL Editor에서 직접 수행하거나, owner 전용 백오피스 기능으로 제한하세요.
