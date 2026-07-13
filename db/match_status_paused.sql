-- 75Rabbit 경기 일시중지 상태 추가
-- 실행 위치: Supabase SQL Editor

alter table public.matches
drop constraint if exists matches_status_check;

alter table public.matches
add constraint matches_status_check
check (status in ('scheduled', 'playing', 'paused', 'finished'));
