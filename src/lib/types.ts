export type EventStatus = 'open' | 'closed' | 'running' | 'finished';
export type RegistrationStatus = 'applied' | 'waitlisted' | 'canceled' | 'checked_in';
export type MatchStatus = 'scheduled' | 'playing' | 'paused' | 'finished';
export type Gender = 'M' | 'F';
export type Team = 'A' | 'B';

export interface EventRow {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  access_code: string;
  max_participants: number;
  court_count: number;
  status: EventStatus;
}

export interface MemberRow {
  id: string;
  name: string;
  gender: Gender | null;
  level: string | null;
  phone_last4: string | null;
  memo: string | null;
}

export interface RegistrationRow {
  id: string;
  event_id: string;
  member_id: string;
  play_type: 'mens' | 'womens' | 'mixed' | 'random' | null;
  partner_name: string | null;
  status: RegistrationStatus;
  note: string | null;
}

export interface CourtRow {
  id: string;
  event_id: string;
  court_no: number;
  name: string | null;
}

export interface MatchRow {
  id: string;
  event_id: string;
  court_id: string | null;
  round_no: number;
  match_no: number;
  team_a_score: number;
  team_b_score: number;
  winner_team: Team | null;
  status: MatchStatus;
}

export interface MatchPlayerInput {
  memberId: string;
  name: string;
  gender?: Gender | null;
  level?: string | null;
}
