-- 75Rabbit 테스트 데이터

insert into events (title, event_date, location, start_time, end_time, access_code, max_participants, court_count, status)
values ('75Rabbit 7월 1주차 운동', '2026-07-04', '청아체육관', '19:00', '22:00', 'CHANGE_ME', 32, 4, 'open')
on conflict do nothing;

-- 최신 모임 id를 기준으로 테스트 코트 생성
with e as (
  select id from events order by created_at desc limit 1
)
insert into courts (event_id, court_no, name)
select e.id, x.no, x.name
from e,
(values (1, '1코트'), (2, '2코트'), (3, '3코트'), (4, '4코트')) as x(no, name)
on conflict do nothing;

-- 테스트 회원
insert into members (name, gender, level, phone_last4, memo) values
('박성우', 'M', 'B', '0001', '테스트'),
('신도훈', 'M', 'A', '0002', '테스트'),
('김윤경', 'F', 'B', '0003', '테스트'),
('백승준', 'M', 'B', '0004', '테스트'),
('진상택', 'M', 'C', '0005', '테스트'),
('정현경', 'F', 'C', '0006', '테스트'),
('형옥진', 'F', 'C', '0007', '테스트'),
('양현수', 'M', 'B', '0008', '테스트')
on conflict do nothing;

-- 참가신청 생성
with e as (select id from events order by created_at desc limit 1)
insert into registrations (event_id, member_id, play_type, status)
select e.id, m.id, 'random', 'checked_in'
from e, members m
where m.memo = '테스트'
on conflict do nothing;
