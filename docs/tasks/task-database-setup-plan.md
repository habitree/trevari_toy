# Task 1: Supabase 설정 및 DB 스키마 구축

> 백엔드 개발의 기반이 되는 데이터베이스 설정 및 스키마 구축

---

## 📋 작업 개요

### 목표
- Supabase PostgreSQL 데이터베이스 설정
- 3개 테이블 생성 (water_logs, condition_memos, ai_reports)
- Supabase 클라이언트 초기화
- 환경 변수 설정

### 우선순위
**P0 (최우선)** - 모든 백엔드 작업의 선행 조건

### 예상 소요 시간
1-2시간

---

## 🎯 상세 작업 내용

### 1. Supabase 프로젝트 연동

#### 1.1 환경 변수 설정
```bash
# .env.local 파일 생성
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (선택)
```

#### 1.2 Supabase 클라이언트 생성
**파일**: `lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export type Database = {
  public: {
    Tables: {
      water_logs: { /* ... */ }
      condition_memos: { /* ... */ }
      ai_reports: { /* ... */ }
    }
  }
}
```

### 2. 데이터베이스 스키마 생성

#### 2.1 water_logs 테이블
```sql
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  intensity VARCHAR(20) NOT NULL CHECK (intensity IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_water_logs_recorded_at ON water_logs(recorded_at DESC);

-- Updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_water_logs_updated_at 
  BEFORE UPDATE ON water_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2.2 condition_ 테이블
```sql
CREATE TABLE condition_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_date DATE NOT NULL UNIQUE,
  condition_type VARCHAR(20) CHECK (condition_type IN ('tired', 'swollen', 'refreshed', 'normal')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_condition_memos_date ON condition_memos(memo_date DESC);

CREATE TRIGGER update_condition_memos_updated_at 
  BEFORE UPDATE ON condition_memos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2.3 ai_reports 테이블
```sql
CREATE TABLE ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  content TEXT NOT NULL,
  report_type VARCHAR(20) DEFAULT 'weekly' CHECK (report_type IN ('weekly', 'on_demand')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_reports_created_at ON ai_reports(created_at DESC);
CREATE INDEX idx_ai_reports_period ON ai_reports(period_start, period_end);
```

### 3. TypeScript 타입 정의

**파일**: `lib/supabase/types.ts`

```typescript
export type WaterLog = {
  id: string
  recorded_at: string
  intensity: 'high' | 'medium' | 'low'
  created_at: string
  updated_at: string
}

export type ConditionMemo = {
  id: string
  memo_date: string
  condition_type: 'tired' | 'swollen' | 'refreshed' | 'normal' | null
  note: string | null
  created_at: string
  updated_at: string
}

export type AIReport = {
  id: string
  period_start: string
  period_end: string
  content: string
  report_type: 'weekly' | 'on_demand'
  created_at: string
}
```

### 4. 연결 테스트

**파일**: `lib/supabase/test-connection.ts` (임시 테스트용)

```typescript
import { supabase } from './client'

export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('water_logs')
      .select('count')
      .limit(1)
    
    if (error) throw error
    console.log('✅ Supabase 연결 성공')
    return true
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error)
    return false
  }
}
```

---

## 📦 필요한 패키지

```bash
npm install @supabase/supabase-js
```

---

## ✅ 완료 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] 환경 변수 설정 완료 (.env.local)
- [ ] `lib/supabase/client.ts` 파일 생성
- [ ] `lib/supabase/types.ts` 파일 생성
- [ ] water_logs 테이블 생성 및 인덱스 설정
- [ ] condition_memos 테이블 생성 및 인덱스 설정
- [ ] ai_reports 테이블 생성 및 인덱스 설정
- [ ] 연결 테스트 성공
- [ ] 다른 Task 개발자에게 DB URL 공유

---

## 🔗 프론트엔드 연동

### 영향받는 페이지
- 모든 페이지 (홈, 히스토리, 리포트)

### 연동 방법
다른 Task에서 `lib/supabase/client.ts`를 import하여 사용

---

## 📚 참고 문서

- [software_design.md](../software_design.md#4-데이터베이스-설계) - ERD 및 스키마 상세
- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## 🚨 주의사항

1. **환경 변수 보안**: `.env.local`을 `.gitignore`에 추가
2. **Supabase URL 공유**: 팀원에게 안전하게 공유
3. **RLS 설정**: MVP에서는 비활성화, 추후 인증 추가 시 활성화
4. **백업**: 스키마 SQL 파일을 Git에 커밋하여 버전 관리

---

**작성일**: 2025-12-20  
**담당**: DB 설정 담당자  
**다음 Task**: Task 2, 3, 4, 5 병렬 시작 가능
