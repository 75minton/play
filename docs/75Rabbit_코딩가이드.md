# 75Rabbit 코딩가이드

## 1. 개발 원칙

- 모바일 우선 설계
- 참석자는 회원가입 없이 신청 가능
- 관리자는 Supabase Auth 기반 로그인 필수
- 관리자 비밀번호, 모임 코드, API 키를 코드에 하드코딩하지 않는다.
- 데이터 변경은 가능한 서버 액션/API Route 또는 Supabase RLS 정책을 통해 보호한다.

## 2. 폴더 구조

```text
src/
  app/
    page.tsx
    join/page.tsx
    status/page.tsx
    draw/page.tsx
    results/page.tsx
    scoreboard/page.tsx
    admin/
      page.tsx
      events/page.tsx
      registrations/page.tsx
      matches/page.tsx
      results/page.tsx
      settings/page.tsx
  components/
  lib/
    supabase/
      client.ts
    matchmaker.ts
    types.ts
```

## 3. 네이밍 규칙

| 구분 | 규칙 | 예시 |
|---|---|---|
| 테이블명 | snake_case 복수형 | registrations |
| 컬럼명 | snake_case | event_date |
| React 컴포넌트 | PascalCase | EventCard |
| 함수 | camelCase | createMatches |
| 상태값 | 영문 소문자 | checked_in |

## 4. TypeScript 규칙

- DB 타입은 `lib/types.ts`에서 관리한다.
- API 응답은 가능한 타입을 명시한다.
- any 사용을 최소화한다.
- 화면 컴포넌트는 입력값 검증을 수행한다.

## 5. UI 규칙

- 참석자 화면은 하단 네비게이션 또는 큰 버튼 중심으로 구성한다.
- 관리자 화면은 카드형 대시보드 + 리스트 + 액션 버튼 중심으로 구성한다.
- 체육관 현장 사용을 고려해 버튼 크기를 크게 한다.
- 전광판은 16:9 TV 화면과 모바일 가로 화면 모두 대응한다.

## 6. 보안 규칙

- `.env.local`은 Git에 올리지 않는다.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 공개되어도 되는 anon key이지만 RLS를 반드시 적용한다.
- service role key는 절대 브라우저로 전달하지 않는다.
- 관리자 권한은 `admins` 테이블의 role로 확인한다.

## 7. Git 커밋 메시지 예시

```text
feat: 참가신청 화면 추가
feat: 대진 자동 생성 로직 추가
fix: 체크인 상태 필터 오류 수정
docs: 배포 가이드 보완
refactor: matchmaker 함수 분리
```
