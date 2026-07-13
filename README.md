# 75Rabbit 배드민턴 모임 관리 웹앱

배드민턴 모임의 참가신청, 대진표, 전광판, 결과입력, 관리자 운영 기능을 제공하는 Next.js + Supabase 기반 웹앱입니다.

## 주요 기능

- 모임코드 기반 참가자 입장
- 참가신청 및 참가자 관리
- 모임별 대진 생성/조회
- 코트별 전광판
- 관리자 점수 입력 및 경기 종료 처리
- 모임별 설정 관리
- Supabase DB 연동
- Vercel 배포 대응

## 기술 스택

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Vercel

## 로컬 실행

```bash
cd src
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 환경변수

`src/.env.example`을 참고해 `src/.env.local`을 생성합니다.

필수 값:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SESSION_SECRET`

## Supabase SQL

Supabase SQL Editor에서 필요 SQL을 실행합니다.

- `db/schema.sql`
- `db/rls.sql`
- `db/admin_auth.sql`
- `db/event_settings.sql`
- `db/match_status_paused.sql`

초기 관리자 계정은 `admin / rabbit`이며, 최초 로그인 후 비밀번호 변경을 요구합니다.

## Vercel 배포

Vercel 프로젝트 설정:

- Root Directory: `src`
- Build Command: `npm run build`
- Framework: Next.js

Vercel 환경변수에는 로컬 `.env.local`과 동일한 Supabase/관리자 세션 값을 등록해야 합니다.
