# Task 5: AI 리포트 생성 API 구현

> Gemini API를 활용한 물 섭취 패턴 분석 및 AI 리포트 생성 기능 구현

---

## 📋 작업 개요

### 목표
- Gemini API 클라이언트 구축 (**gemini-3-flash-preview** 모델 필수)
- AI 리포트 생성 API 구현
- 리포트 목록 조회 API 구현
- 리포트 페이지와 연동

### 우선순위
**P0 (필수)** - 핵심 차별화 기능

### 예상 소요 시간
3-4시간

### 의존성
- Task 1 완료 필수 (Supabase 설정)
- Task 2, 3 데이터 참조 (물 섭취 기록, 컨디션 메모)

---

## 🎯 상세 작업 내용

### 1. Gemini API 클라이언트 구축

#### 1.1 환경 변수 설정
```bash
# .env.local에 추가
GEMINI_API_KEY=your-gemini-api-key
```

#### 1.2 Gemini 클라이언트 생성
**파일**: `lib/ai/gemini.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateWaterIntakeReport(
  waterLogs: any[],
  conditionMemos: any[],
  periodStart: string,
  periodEnd: string
): Promise<string> {
  try {
    // ⚠️ 중요: 반드시 gemini-3-flash-preview 모델 사용
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview' 
    })
    
    const prompt = buildPrompt(waterLogs, conditionMemos, periodStart, periodEnd)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    return text
  } catch (error) {
    console.error('Gemini API 호출 실패:', error)
    throw new Error('AI 리포트 생성에 실패했습니다.')
  }
}

function buildPrompt(
  waterLogs: any[],
  conditionMemos: any[],
  periodStart: string,
  periodEnd: string
): string {
  // 물 섭취 데이터 요약
  const totalLogs = waterLogs.length
  const highCount = waterLogs.filter(log => log.intensity === 'high').length
  const mediumCount = waterLogs.filter(log => log.intensity === 'medium').length
  const lowCount = waterLogs.filter(log => log.intensity === 'low').length
  
  // 요일별 패턴 분석
  const logsByDayOfWeek = waterLogs.reduce((acc, log) => {
    const date = new Date(log.recorded_at)
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // 시간대별 패턴
  const logsByTimeOfDay = waterLogs.reduce((acc, log) => {
    const hour = new Date(log.recorded_at).getHours()
    const period = hour < 12 ? '오전' : hour < 18 ? '오후' : '저녁'
    acc[period] = (acc[period] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // 컨디션 메모 요약
  const conditionSummary = conditionMemos.map(memo => 
    `${memo.memo_date}: ${memo.condition_type} ${memo.note ? `(${memo.note})` : ''}`
  ).join('\n')
  
  return `
당신은 물 섭취 습관을 분석하는 친근하고 공감적인 AI 코치입니다.

# 분석 기간
${periodStart} ~ ${periodEnd}

# 물 섭취 데이터
- 총 기록 횟수: ${totalLogs}회
- 마셨음 (high): ${highCount}회
- 조금 마셨음 (medium): ${mediumCount}회
- 거의 안 마셨음 (low): ${lowCount}회

# 요일별 패턴
${Object.entries(logsByDayOfWeek).map(([day, count]) => `${day}요일: ${count}회`).join('\n')}

# 시간대별 패턴
${Object.entries(logsByTimeOfDay).map(([time, count]) => `${time}: ${count}회`).join('\n')}

# 컨디션 메모
${conditionSummary || '기록 없음'}

---

# 리포트 작성 원칙
1. **관찰 → 해석 → 제안** 순서로 자연스럽게 작성
2. **평가·훈계·실패 전제 언어 절대 금지**
3. **긍정적이고 공감적인 톤 유지**
4. **구체적인 패턴을 언급**
5. **2-3문단, 200-300자 내외로 작성**
6. **"완벽하지 않아도 괜찮다"는 메시지 전달**

# 출력 예시
"완벽하진 않았지만, 지난주보다 오후 시간대에 물을 마신 기록이 늘어났어요.
특히 평일에는 꾸준히 기록이 남았네요. 

주말엔 조금 적었던 것 같은데, 쉬는 날엔 시간이 불규칙해서 그럴 수 있어요.
다음 주에는 오전 시간대에도 한 번 정도 마셔보면 어떨까요?"

---

위 데이터를 바탕으로 사용자를 위한 친근하고 공감적인 물 섭취 패턴 리포트를 작성해주세요.
`.trim()
}
```

### 2. API Routes 구현

#### 2.1 리포트 생성 API
**파일**: `app/api/reports/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { generateWaterIntakeReport } from '@/lib/ai/gemini'
import { subDays } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const { periodStart, periodEnd } = await request.json()
    
    // 기본값: 최근 7일
    const end = periodEnd ? new Date(periodEnd) : new Date()
    const start = periodStart ? new Date(periodStart) : subDays(end, 6)
    
    // 물 섭취 데이터 조회
    const { data: waterLogs, error: waterError } = await supabase
      .from('water_logs')
      .select('*')
      .gte('recorded_at', start.toISOString())
      .lte('recorded_at', end.toISOString())
      .order('recorded_at', { ascending: true })
    
    if (waterError) throw waterError
    
    // 최소 데이터 검증
    if (!waterLogs || waterLogs.length < 3) {
      return NextResponse.json(
        { 
          error: '리포트 생성을 위해 최소 3개 이상의 기록이 필요합니다.',
          minDataRequired: true 
        },
        { status: 400 }
      )
    }
    
    // 컨디션 메모 조회
    const { data: conditionMemos, error: memoError } = await supabase
      .from('condition_memos')
      .select('*')
      .gte('memo_date', start.toISOString().split('T')[0])
      .lte('memo_date', end.toISOString().split('T')[0])
    
    if (memoError) throw memoError
    
    // AI 리포트 생성
    const reportContent = await generateWaterIntakeReport(
      waterLogs,
      conditionMemos || [],
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    )
    
    // 리포트 저장
    const { data: savedReport, error: saveError } = await supabase
      .from('ai_reports')
      .insert({
        period_start: start.toISOString().split('T')[0],
        period_end: end.toISOString().split('T')[0],
        content: reportContent,
        report_type: periodStart ? 'on_demand' : 'weekly'
      })
      .select()
      .single()
    
    if (saveError) throw saveError
    
    return NextResponse.json({ success: true, data: savedReport })
  } catch (error: any) {
    console.error('리포트 생성 실패:', error)
    return NextResponse.json(
      { error: error.message || '리포트 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

#### 2.2 리포트 조회 API
**파일**: `app/api/reports/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const { data, error } = await supabase
      .from('ai_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('리포트 조회 실패:', error)
    return NextResponse.json(
      { error: '리포트 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

**파일**: `app/api/reports/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('리포트 상세 조회 실패:', error)
    return NextResponse.json(
      { error: '리포트 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

### 3. Server Actions 구현

**파일**: `actions/reports.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase/client'
import { generateWaterIntakeReport } from '@/lib/ai/gemini'
import { subDays } from 'date-fns'

export async function generateReport() {
  try {
    const end = new Date()
    const start = subDays(end, 6)
    
    // 물 섭취 데이터 조회
    const { data: waterLogs, error: waterError } = await supabase
      .from('water_logs')
      .select('*')
      .gte('recorded_at', start.toISOString())
      .lte('recorded_at', end.toISOString())
    
    if (waterError) throw waterError
    
    if (!waterLogs || waterLogs.length < 3) {
      return {
        success: false,
        error: '리포트 생성을 위해 최소 3개 이상의 기록이 필요합니다.'
      }
    }
    
    // 컨디션 메모 조회
    const { data: conditionMemos } = await supabase
      .from('condition_memos')
      .select('*')
      .gte('memo_date', start.toISOString().split('T')[0])
      .lte('memo_date', end.toISOString().split('T')[0])
    
    // AI 리포트 생성
    const reportContent = await generateWaterIntakeReport(
      waterLogs,
      conditionMemos || [],
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    )
    
    // 저장
    const { data: savedReport, error: saveError } = await supabase
      .from('ai_reports')
      .insert({
        period_start: start.toISOString().split('T')[0],
        period_end: end.toISOString().split('T')[0],
        content: reportContent,
        report_type: 'on_demand'
      })
      .select()
      .single()
    
    if (saveError) throw saveError
    
    revalidatePath('/reports')
    return { success: true, data: savedReport }
  } catch (error: any) {
    console.error('리포트 생성 실패:', error)
    return { success: false, error: error.message || '리포트 생성에 실패했습니다.' }
  }
}

export async function getReports() {
  try {
    const { data, error } = await supabase
      .from('ai_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('리포트 조회 실패:', error)
    return { success: false, error: '리포트 조회에 실패했습니다.', data: [] }
  }
}
```

### 4. 프론트엔드 연동

#### 4.1 ReportGenerator 컴포넌트 수정
**파일**: `components/features/reports/report-generator.tsx`

```typescript
'use client'

import { useState } from 'react'
import { generateReport } from '@/actions/reports'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Sparkles } from 'lucide-react'

export function ReportGenerator() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await generateReport()
      
      if (result.success) {
        toast({
          title: 'AI 리포트 생성 완료',
          description: '새로운 리포트가 생성되었습니다.',
        })
        window.location.reload() // 리포트 목록 새로고침
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: '리포트 생성 실패',
        description: error.message || '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-water" />
          AI 리포트 생성
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          최근 7일간의 물 섭취 패턴을 AI가 분석해드립니다.
        </p>
        <Button 
          onClick={handleGenerate} 
          disabled={loading}
          className="w-full"
        >
          {loading ? '생성 중...' : '리포트 생성하기'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

#### 4.2 ReportList 컴포넌트 수정
**파일**: `components/features/reports/report-list.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getReports } from '@/actions/reports'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export function ReportList() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadReports()
  }, [])
  
  const loadReports = async () => {
    setLoading(true)
    const result = await getReports()
    if (result.success) {
      setReports(result.data || [])
    }
    setLoading(false)
  }
  
  if (loading) return <div>로딩 중...</div>
  if (reports.length === 0) return <div>아직 생성된 리포트가 없습니다.</div>
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">지난 리포트</h3>
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {format(new Date(report.period_start), 'M월 d일', { locale: ko })} 
                {' ~ '}
                {format(new Date(report.period_end), 'M월 d일', { locale: ko })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{report.content}</p>
              <p className="text-xs text-muted-foreground mt-4">
                생성일: {format(new Date(report.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

## 📦 필요한 패키지

```bash
npm install @google/generative-ai date-fns
```

---

## ✅ 완료 체크리스트

- [ ] Gemini API 키 환경 변수 설정
- [ ] `@google/generative-ai` 패키지 설치
- [ ] `lib/ai/gemini.ts` 구현 (**gemini-3-flash-preview** 모델 확인 필수)
- [ ] `app/api/reports/generate/route.ts` 구현
- [ ] `app/api/reports/route.ts` 구현
- [ ] `app/api/reports/[id]/route.ts` 구현
- [ ] `actions/reports.ts` 구현
- [ ] ReportGenerator 컴포넌트 연동
- [ ] ReportList 컴포넌트 연동
- [ ] API 테스트 (실제 Gemini 호출 확인)
- [ ] 프롬프트 품질 검증
- [ ] 프론트엔드 통합 테스트

---

## 🔗 프론트엔드 연동

### 영향받는 페이지
- 리포트 페이지 (`/reports`)

### 사용하는 컴포넌트
- `components/features/reports/report-generator.tsx`
- `components/features/reports/report-list.tsx`

---

## 📚 참고 문서

- [user_stories.md](../user_stories.md) - US-005, US-006, US-007, US-008
- [PRD.md](../PRD.md) - AI 리포트 톤 및 원칙
- [software_design.md](../software_design.md#7-ai-통합-설계)
- [Gemini API 공식 문서](https://ai.google.dev/gemini-api/docs)

---

## 🚨 중요 주의사항

### Gemini 모델 사용
⚠️ **반드시 `gemini-3-flash-preview` 모델을 사용해야 합니다.**

```typescript
// ❌ 잘못된 예시
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
const model = genAI.getGenerativeModel({ model: 'gemini-flash' })

// ✅ 올바른 예시
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
```

### 프롬프트 설계 원칙
1. 평가·훈계·실패 전제 언어 금지2. 관찰 → 해석 → 제안 순서
3. 긍정적이고 공감적인 톤
4. 구체적인 패턴 언급

### 에러 핸들링
- API 호출 실패 시 사용자 친화적 메시지
- 최소 데이터 조건 검증 (3개 이상)
- 리트라이 로직 고려 (선택)

---

**작성일**: 2025-12-20  
**의존성**: Task 1 완료 후 시작 가능 (Task 2, 3과 병렬 개발 가능)
