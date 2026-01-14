# Vercel 배포 가이드

## 필수 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 1. Supabase 설정
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key

### 2. Gemini API 설정
- `GEMINI_API_KEY`: Google Gemini API 키

## 환경 변수 설정 방법

1. Vercel 대시보드에 접속
2. 프로젝트 선택
3. Settings > Environment Variables 메뉴로 이동
4. 위의 환경 변수들을 추가

## 배포 후 확인 사항

1. 빌드 로그 확인: Vercel 대시보드의 Deployments 탭에서 빌드 로그 확인
2. 런타임 오류 확인: Functions 탭에서 API 라우트 오류 확인
3. 환경 변수 확인: Settings > Environment Variables에서 모든 변수가 설정되었는지 확인

## 일반적인 오류 해결

### 404 NOT_FOUND 오류
- 환경 변수가 제대로 설정되었는지 확인
- Supabase 테이블이 생성되었는지 확인 (`lib/supabase/schema.sql` 참고)

### 빌드 오류
- `next.config.mjs`에서 `ignoreBuildErrors: true`가 설정되어 있어 TypeScript 오류는 무시됩니다
- 하지만 런타임 오류는 여전히 발생할 수 있으므로 주의

### API 라우트 오류
- Supabase 클라이언트가 제대로 초기화되었는지 확인
- 환경 변수가 `NEXT_PUBLIC_` 접두사로 시작하는지 확인 (클라이언트 사이드에서 사용)
