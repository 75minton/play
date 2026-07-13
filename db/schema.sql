-- 75Rabbit Supabase PostgreSQL Schema
-- 실행 위치: Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  location text,
  start_time time,
  end_time time,
  access_code text not null,
  max_participants int default 40,
  court_count int default 4,
  status text default 'open' check (status in ('open', 'closed', 'running', 'finished')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text check (gender in ('M', 'F')),
  level text,
  phone_last4 text,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name, phone_last4)
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  play_type text check (play_type in ('mens', 'womens', 'mixed', 'random')),
  partner_name text,
  status text default 'applied' check (status in ('applied', 'waitlisted', 'canceled', 'checked_in')),
  note text,
  checkin_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, member_id)
);

create table if not exists courts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  court_no int not null,
  name text,
  created_at timestamptz default now(),
  unique(event_id, court_no)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  court_id uuid references courts(id),
  round_no int not null,
  match_no int not null,
  team_a_score int default 0,
  team_b_score int default 0,
  winner_team text check (winner_team in ('A', 'B') or winner_team is null),
  status text default 'scheduled' check (status in ('scheduled', 'playing', 'finished')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, round_no, match_no)
);

create table if not exists match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  team text not null check (team in ('A', 'B')),
  position_no int not null check (position_no in (1, 2)),
  created_at timestamptz default now(),
  unique(match_id, member_id),
  unique(match_id, team, position_no)
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  name text,
  role text default 'operator' check (role in ('owner', 'admin', 'operator')),
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(id),
  action text not null,
  target_table text,
  target_id uuid,
  payload jsonb,
  created_at timestamptz default now()
);

-- updated_at 자동 갱신 함수
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_events_updated_at
before update on events
for each row execute function set_updated_at();

create trigger trg_members_updated_at
before update on members
for each row execute function set_updated_at();

create trigger trg_registrations_updated_at
before update on registrations
for each row execute function set_updated_at();

create trigger trg_matches_updated_at
before update on matches
for each row execute function set_updated_at();

-- 조회 성능용 인덱스
create index if not exists idx_events_date on events(event_date);
create index if not exists idx_events_access_code on events(access_code);
create index if not exists idx_registrations_event on registrations(event_id);
create index if not exists idx_registrations_status on registrations(status);
create index if not exists idx_matches_event_round on matches(event_id, round_no);
create index if not exists idx_match_players_match on match_players(match_id);
