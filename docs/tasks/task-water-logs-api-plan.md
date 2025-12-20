# Task 2: 물 섭취 기록 API 구현

> 홈 페이지의 물 섭취 기록 생성/조회/수정/삭제 기능 구현

---

## 📋 작업 개요

### 목표
- 물 섭취 기록 CRUD API 구현
- 홈 페이지 컴포넌트와 연동
- Server Actions 및 API Routes 구현

### 우선순위
**P0 (필수)**

### 예상 소요 시간
2-3시간

### 의존성
- Task 1 완료 필수 (Supabase 설정)

---

## 🎯 상세 작업 내용

### 1. API Routes 구현

#### 1.1 물 섭취 기록 생성
**파일**: `app/api/water-logs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { intensity, recorded_at } = await request.json()
    
    // 유효성 검사
    if (!['high', 'medium', 'low'].includes(intensity)) {
      return NextResponse.json(
        { error: '잘못된 intensity 값입니다.' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('water_logs')
      .insert({
        intensity,
        recorded_at: recorded_at || new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('물 섭취 기록 생성 실패:', error)
    return NextResponse.json(
      { error: '기록 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    let query = supabase
      .from('water_logs')
      .select('*')
      .order('recorded_at', { ascending: false })
    
    if (from) {
      query = query.gte('recorded_at', from)
    }
    if (to) {
      query = query.lte('recorded_at', to)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('물 섭취 기록 조회 실패:', error)
    return NextResponse.json(
      { error: '기록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

#### 1.2 물 섭취 기록 수정/삭제
**파일**: `app/api/water-logs/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { intensity } = await request.json()
    
    const { data, error } = await supabase
      .from('water_logs')
      .update({ intensity })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('물 섭취 기록 수정 실패:', error)
    return NextResponse.json(
      { error: '기록 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('water_logs')
      .delete()
      .eq('id', params.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('물 섭취 기록 삭제 실패:', error)
    return NextResponse.json(
      { error: '기록 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

### 2. Server Actions 구현

**파일**: `actions/water-logs.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase/client'

export async function createWaterLog(intensity: 'high' | 'medium' | 'low') {
  try {
    const { data, error } = await supabase
      .from('water_logs')
      .insert({ intensity })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/')
    return { success: true, data }
  } catch (error) {
    console.error('물 섭취 기록 생성 실패:', error)
    return { success: false, error: '기록 생성에 실패했습니다.' }
  }
}

export async function getTodayWaterLogs() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .gte('recorded_at', today.toISOString())
      .order('recorded_at', { ascending: false })
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('오늘 기록 조회 실패:', error)
    return { success: false, error: '기록 조회에 실패했습니다.', data: [] }
  }
}

export async function updateWaterLog(id: string, intensity: 'high' | 'medium' | 'low') {
  try {
    const { data, error } = await supabase
      .from('water_logs')
      .update({ intensity })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/')
    return { success: true, data }
  } catch (error) {
    console.error('물 섭취 기록 수정 실패:', error)
    return { success: false, error: '기록 수정에 실패했습니다.' }
  }
}

export async function deleteWaterLog(id: string) {
  try {
    const { error } = await supabase
      .from('water_logs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('물 섭취 기록 삭제 실패:', error)
    return { success: false, error: '기록 삭제에 실패했습니다.' }
  }
}
```

### 3. 프론트엔드 연동

#### 3.1 IntakeRecorder 컴포넌트 수정
**파일**: `components/features/intake/intake-recorder.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createWaterLog } from '@/actions/water-logs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function IntakeRecorder() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const handleRecord = async (intensity: 'high' | 'medium' | 'low') => {
    setLoading(true)
    try {
      const result = await createWaterLog(intensity)
      
      if (result.success) {
        toast({
          title: '기록 완료',
          description: '물 섭취가 기록되었습니다.',
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: '기록 실패',
        description: '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">물을 마셨나요?</h3>
      <div className="grid grid-cols-3 gap-4">
        <Button 
          onClick={() => handleRecord('high')} 
          disabled={loading}
        >
          마셨음
        </Button>
        <Button 
          onClick={() => handleRecord('medium')} 
          disabled={loading}
          variant="outline"
        >
          조금 마셨음
        </Button>
        <Button 
          onClick={() => handleRecord('low')} 
          disabled={loading}
          variant="outline"
        >
          거의 안 마셨음
        </Button>
      </div>
    </div>
  )
}
```

#### 3.2 TodayIntakeList 컴포넌트 수정
**파일**: `components/features/intake/today-intake-list.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getTodayWaterLogs, deleteWaterLog } from '@/actions/water-logs'
import { WaterLog } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export function TodayIntakeList() {
  const [logs, setLogs] = useState<WaterLog[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadLogs()
  }, [])
  
  const loadLogs = async () => {
    setLoading(true)
    const result = await getTodayWaterLogs()
    if (result.success) {
      setLogs(result.data || [])
    }
    setLoading(false)
  }
  
  const handleDelete = async (id: string) => {
    const result = await deleteWaterLog(id)
    if (result.success) {
      await loadLogs()
    }
  }
  
  if (loading) return <div>로딩 중...</div>
  if (logs.length === 0) return <div>오늘 기록이 없습니다.</div>
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">오늘의 기록</h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">
                {format(new Date(log.recorded_at), 'HH:mm', { locale: ko })}
              </p>
              <p className="text-sm text-muted-foreground">
                {log.intensity === 'high' && '마셨음'}
                {log.intensity === 'medium' && '조금 마셨음'}
                {log.intensity === 'low' && '거의 안 마셨음'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleDelete(log.id)}
            >
              삭제
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## ✅ 완료 체크리스트

- [ ] `app/api/water-logs/route.ts` 구현 (POST, GET)
- [ ] `app/api/water-logs/[id]/route.ts` 구현 (PATCH, DELETE)
- [ ] `actions/water-logs.ts` 구현
- [ ] IntakeRecorder 컴포넌트 연동
- [ ] TodayIntakeList 컴포넌트 연동
- [ ] API 엔드포인트 테스트 (Postman/Thunder Client)
- [ ] 프론트엔드 통합 테스트
- [ ] 에러 핸들링 확인

---

## 🔗 프론트엔드 연동

### 영향받는 페이지
- 홈 페이지 (`/`)

### 사용하는 컴포넌트
- `components/features/intake/intake-recorder.tsx`
- `components/features/intake/today-intake-list.tsx`

---

## 📚 참고 문서

- [user_stories.md](../user_stories.md) - US-001, US-003, US-015
- [software_design.md](../software_design.md#6-백엔드-설계)

---

**작성일**: 2025-12-20  
**의존성**: Task 1 완료 후 시작 가능
