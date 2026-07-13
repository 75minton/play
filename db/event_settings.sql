-- 75Rabbit 모임별 경기 설정 확장
-- 실행 위치: Supabase SQL Editor

alter table public.events
add column if not exists match_count int;

comment on column public.events.match_count is '대진 생성 시 기본으로 사용할 지정 경기수';
