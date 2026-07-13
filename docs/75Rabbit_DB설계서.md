# 75Rabbit DB 설계서

## 1. DBMS

권장 DBMS는 Supabase PostgreSQL이다. 무료 가입으로 시작 가능하고, 인증/Auth, Realtime, API 자동 생성, 관리 UI가 함께 제공되어 MVP 구현에 적합하다.

## 2. 주요 엔티티

| 엔티티 | 테이블 | 설명 |
|---|---|---|
| 모임 | events | 운동 일자, 장소, 코드, 정원, 코트 수 |
| 회원 | members | 참석자 기본 정보 |
| 참가신청 | registrations | 모임별 신청 상태 |
| 코트 | courts | 모임별 코트 정보 |
| 경기 | matches | 라운드/코트별 경기 |
| 경기선수 | match_players | 경기별 팀과 선수 |
| 관리자 | admins | 관리자 권한 |
| 운영로그 | audit_logs | 주요 변경 로그 |

## 3. 상태값 정의

### events.status

| 값 | 의미 |
|---|---|
| open | 모집중 |
| closed | 신청마감 |
| running | 진행중 |
| finished | 종료 |

### registrations.status

| 값 | 의미 |
|---|---|
| applied | 신청 |
| waitlisted | 대기 |
| canceled | 취소 |
| checked_in | 현장 체크인 |

### matches.status

| 값 | 의미 |
|---|---|
| scheduled | 예정 |
| playing | 진행중 |
| finished | 종료 |

## 4. 관계

```text
events 1:N registrations
events 1:N courts
events 1:N matches
members 1:N registrations
matches 1:N match_players
members 1:N match_players
```

## 5. SQL 파일

- `db/schema.sql` : 테이블 생성
- `db/rls.sql` : Row Level Security 정책 예시
- `db/seed.sql` : 테스트 데이터
