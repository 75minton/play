# 75Rabbit 개발/실행/배포 가이드

## 1. 개발환경

- Node.js 20 이상 권장
- npm 또는 pnpm
- Supabase 계정
- Vercel 계정

## 2. Supabase 설정

1. Supabase 프로젝트 생성
2. SQL Editor에서 `db/schema.sql` 실행
3. 필요 시 `db/seed.sql` 실행
4. Authentication 이메일 로그인을 활성화
5. 운영자 이메일 계정 생성
6. `admins` 테이블에 운영자 user_id 등록
7. `db/rls.sql` 정책 적용

## 3. 로컬 실행

```bash
cd src
cp .env.example .env.local
npm install
npm run dev
```

`.env.local` 예시:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 4. 배포

### Vercel 배포

1. GitHub 저장소 생성
2. `src` 폴더를 프로젝트 루트로 배포하거나, Vercel Root Directory를 `src`로 설정
3. 환경변수 등록
4. Deploy 실행

## 5. 운영 전 체크리스트

- 기존 노출된 관리자 ID/PW 사용 금지
- 기존 노출된 모임 코드 변경
- 관리자 메뉴 로그인 전 비노출 확인
- RLS 정책 적용 확인
- 테스트 모임 생성
- 참가신청 테스트
- 체크인 테스트
- 대진 생성 테스트
- 결과 입력 테스트
- 모바일 화면 테스트
- 전광판 전체화면 테스트

## 6. 초기 운영 방식

- 매주 새 모임 생성
- 모임 코드 변경 또는 회차별 코드 생성
- 카카오톡에 참가신청 링크 공유
- 현장에서 체크인 후 대진 생성
- 전광판을 TV/태블릿에 표시
- 경기 종료 후 결과 저장
