# 75Rabbit 배드민턴 모임 관리 웹프로그램 개발 패키지

이 패키지는 기존 Google Sites 기반 75Rabbit 배드민턴 모임 사이트를 독립 웹앱으로 전환하기 위한 개발 착수 자료입니다.

## 포함 자료

- `docs/75Rabbit_웹프로그램_개발자료집.docx` : 분석/설계/DB/화면/개발/배포 통합 문서
- `docs/75Rabbit_기능설계서.md` : 기능 요구사항과 화면 흐름
- `docs/75Rabbit_DB설계서.md` : DB 테이블 구조와 관계
- `docs/75Rabbit_코딩가이드.md` : 개발 규칙, 폴더 구조, 네이밍, 보안 가이드
- `docs/75Rabbit_개발_실행_배포_가이드.md` : 로컬 실행, Supabase, Vercel 배포 가이드
- `db/schema.sql` : Supabase PostgreSQL 테이블 생성 SQL
- `db/rls.sql` : Supabase Row Level Security 기본 정책 예시
- `db/seed.sql` : 테스트 데이터 예시
- `src/` : Next.js + Supabase 샘플 웹앱 소스

## 권장 기술 스택

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend/DB: Supabase PostgreSQL, Supabase Auth, RLS, Realtime
- Deploy: Vercel Hobby 또는 Netlify Free

## 시작 순서

1. Supabase 프로젝트 생성
2. `db/schema.sql` 실행
3. 필요 시 `db/seed.sql` 실행
4. `.env.example`을 `.env.local`로 복사 후 Supabase URL/Key 입력
5. `npm install`
6. `npm run dev`

```bash
cd src
cp .env.example .env.local
npm install
npm run dev
```

## 보안 주의

기존에 노출된 모임 코드 및 관리자 ID/PW는 운영 전 반드시 변경하세요. 새 시스템은 관리자 계정을 Supabase Auth 기반으로 구성하고, 관리자 메뉴를 일반 사용자에게 노출하지 않는 것을 전제로 설계했습니다.
