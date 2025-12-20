# Task 3: 컨디션 메모 API 구현

> 선택적 컨디션 메모 기록 및 조회 기능 구현

---

## 📋 작업 개요

### 목표
- 컨디션 메모 생성/조회 API 구현
- 홈 페이지에서 하루 1회 컨디션 입력 지원
- AI 리포트에서 활용할 데이터 제공

### 우선순위
**P1 (높음)**

### 예상 소요 시간
1-2시간

### 의존성
- Task 1 완료 필수 (Supabase 설정)

---

## 🎯 상세 작업 내용

### 1. API Routes 구현

**파일**: `app/api/condition-memos/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { memo_date, condition_type, note } = await request.json()
    
    // Upsert (날짜별로 unique하므로)
    const { data, error } = await supabase
      .from('condition_memos')
      .upsert({
        memo_date,
        condition_type,
        note
      }, {
        onConflict: 'memo_date'
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('컨디션 메모 저장 실패:', error)
    return NextResponse.json(
      { error: '메모 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    let query = supabase
      .from('condition_memos')
      .select('*')
      .order('memo_date', { ascending: false })
    
    if (date) {
      query = query.eq('memo_date', date)
    } else if (from && to) {
      query = query.gte('memo_date', from).lte('memo_date', to)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: date ? (data[0] || null) : data })
  } catch (error) {
    console.error('컨디션 메모 조회 실패:', error)
    return NextResponse.json(
      { error: '메모 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

### 2. Server Actions 구현

**파일**: `actions/condition-memos.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase/client'

export async function saveConditionMemo(
  memoDate: string,
  conditionType: 'tired' | 'swollen' | 'refreshed' | 'normal' | null,
  note?: string
) {
  try {
    const { data, error } = await supabase
      .from('condition_memos')
      .upsert({
        memo_date: memoDate,
        condition_type: conditionType,
        note: note || null
      }, {
        onConflict: 'memo_date'
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/')
    return { success: true, data }
  } catch (error) {
    console.error('컨디션 메모 저장 실패:', error)
    return { success: false, error: '메모 저장에 실패했습니다.' }
  }
}

export async function getTodayConditionMemo() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('condition_memos')
      .select('*')
      .eq('memo_date', today)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    
    return { success: true, data: data || null }
  } catch (error) {
    console.error('컨디션 메모 조회 실패:', error)
    return { success: false, error: '메모 조회에 실패했습니다.', data: null }
  }
}
```

### 3. 프론트엔드 연동

#### 3.1 ConditionMemo 컴포넌트 생성
**파일**: `components/features/intake/condition-memo.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { saveConditionMemo, getTodayConditionMemo } from '@/actions/condition-memos'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const CONDITIONS = [
  { value: 'refreshed', label: '개운함', emoji: '😊' },
  { value: 'normal', label: '보통', emoji: '😐' },
  { value: 'tired', label: '피로함', emoji: '😫' },
  { value: 'swollen', label: '붓기', emoji: '😵' },
] as const

export function ConditionMemo() {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)
  const { toast } = useToast()
  
  useEffect(() => {
    loadTodayMemo()
  }, [])
  
  const loadTodayMemo = async () => {
    const result = await getTodayConditionMemo()
    if (result.success && result.data) {
      setSelectedCondition(result.data.condition_type)
      setNote(result.data.note || '')
      setHasRecorded(true)
    }
  }
  
  const handleSave = async () => {
    if (!selectedCondition) return
    
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const result = await saveConditionMemo(
        today,
        selectedCondition as any,
        note
      )
      
      if (result.success) {
        toast({
          title: '저장 완료',
          description: '오늘의 컨디션이 기록되었습니다.',
        })
        setHasRecorded(true)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘 컨디션은 어땠어요?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {CONDITIONS.map((condition) => (
            <Button
              key={condition.value}
              variant={selectedCondition === condition.value ? 'default' : 'outline'}
              onClick={() => setSelectedCondition(condition.value)}
              className="h-auto py-4"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">{condition.emoji}</span>
                <span>{condition.label}</span>
              </div>
            </Button>
          ))}
        </div>
        
        <Textarea
          placeholder="추가 메모 (선택사항)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
        
        <Button 
          onClick={handleSave} 
          disabled={!selectedCondition || loading}
          className="w-full"
        >
          {hasRecorded ? '수정하기' : '저장하기'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

#### 3.2 홈 페이지에 추가
**파일**: `app/page.tsx` (수정)

```typescript
import { IntakeRecorder } from "@/components/features/intake/intake-recorder"
import { TodayIntakeList } from "@/components/features/intake/today-intake-list"
import { ConditionMemo } from "@/components/features/intake/condition-memo"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export default function HomePage() {
  const today = new Date()

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {format(today, "yyyy년 M월 d일", { locale: ko })}
            </h1>
            <p className="text-muted-foreground">오늘의 물 섭취를 기록해보세요</p>
          </div>

          <IntakeRecorder />
          
          <ConditionMemo />
          
          <TodayIntakeList />
        </div>
      </main>
    </div>
  )
}
```

---

## ✅ 완료 체크리스트

- [ ] `app/api/condition-memos/route.ts` 구현
- [ ] `actions/condition-memos.ts` 구현
- [ ] ConditionMemo 컴포넌트 생성
- [ ] 홈 페이지에 컴포넌트 추가
- [ ] API 테스트
- [ ] 프론트엔드 통합 테스트
- [ ] Upsert 로직 검증 (같은 날짜 중복 방지)

---

## 🔗 프론트엔드 연동

### 영향받는 페이지
- 홈 페이지 (`/`)

### 새로 생성할 컴포넌트
- `components/features/intake/condition-memo.tsx`

---

## 📚 참고 문서

- [user_stories.md](../user_stories.md) - US-009, US-010
- [PRD.md](../PRD.md) - 컨디션 메모 요구사항

---

**작성일**: 2025-12-20  
**의존성**: Task 1 완료 후 시작 가능
