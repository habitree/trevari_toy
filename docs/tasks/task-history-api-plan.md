# Task 4: 히스토리 조회 API 구현

> 캘린더 뷰를 위한 날짜별 물 섭취 기록 조회 기능 구현

---

## 📋 작업 개요

### 목표
- 날짜 범위별 물 섭취 기록 조회 API 구현
- 캘린더 뷰용 통계 데이터 제공
- 히스토리 페이지와 연동

### 우선순위
**P0 (필수)**

### 예상 소요 시간
2-3시간

### 의존성
- Task 1 완료 필수 (Supabase 설정)
- Task 2 데이터 참조 (물 섭취 기록)

---

## 🎯 상세 작업 내용

### 1. API Routes 구현

**파일**: `app/api/history/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM 형식
    
    if (!month) {
      return NextResponse.json(
        { error: 'month 파라미터가 필요합니다.' },
        { status: 400 }
      )
    }
    
    const [year, monthNum] = month.split('-').map(Number)
    const monthStart = startOfMonth(new Date(year, monthNum - 1))
    const monthEnd = endOfMonth(new Date(year, monthNum - 1))
    
    // 물 섭취 기록 조회
    const { data: waterLogs, error: waterError } = await supabase
      .from('water_logs')
      .select('*')
      .gte('recorded_at', monthStart.toISOString())
      .lte('recorded_at', monthEnd.toISOString())
      .order('recorded_at', { ascending: true })
    
    if (waterError) throw waterError
    
    // 컨디션 메모 조회
    const { data: conditionMemos, error: memoError } = await supabase
      .from('condition_memos')
      .select('*')
      .gte('memo_date', monthStart.toISOString().split('T')[0])
      .lte('memo_date', monthEnd.toISOString().split('T')[0])
    
    if (memoError) throw memoError
    
    // 날짜별로 그룹화
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const dailyData = allDays.map(date => {
      const dateStr = date.toISOString().split('T')[0]
      const logsOfDay = waterLogs?.filter(log => 
        log.recorded_at.startsWith(dateStr)
      ) || []
      
      const memoOfDay = conditionMemos?.find(memo => 
        memo.memo_date === dateStr
      ) || null
      
      return {
        date: dateStr,
        logs: logsOfDay,
        logCount: logsOfDay.length,
        intensitySummary: {
          high: logsOfDay.filter(l => l.intensity === 'high').length,
          medium: logsOfDay.filter(l => l.intensity === 'medium').length,
          low: logsOfDay.filter(l => l.intensity === 'low').length,
        },
        conditionMemo: memoOfDay
      }
    })
    
    return NextResponse.json({ success: true, data: dailyData })
  } catch (error) {
    console.error('히스토리 조회 실패:', error)
    return NextResponse.json(
      { error: '히스토리 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

### 2. Server Actions 구현

**파일**: `actions/history.ts`

```typescript
'use server'

import { supabase } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export async function getMonthlyHistory(year: number, month: number) {
  try {
    const monthStart = startOfMonth(new Date(year, month - 1))
    const monthEnd = endOfMonth(new Date(year, month - 1))
    
    // 물 섭취 기록 조회
    const { data: waterLogs, error: waterError } = await supabase
      .from('water_logs')
      .select('*')
      .gte('recorded_at', monthStart.toISOString())
      .lte('recorded_at', monthEnd.toISOString())
      .order('recorded_at', { ascending: true })
    
    if (waterError) throw waterError
    
    // 컨디션 메모 조회
    const { data: conditionMemos, error: memoError } = await supabase
      .from('condition_memos')
      .select('*')
      .gte('memo_date', monthStart.toISOString().split('T')[0])
      .lte('memo_date', monthEnd.toISOString().split('T')[0])
    
    if (memoError) throw memoError
    
    // 날짜별 데이터 구성
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const dailyData = allDays.map(date => {
      const dateStr = date.toISOString().split('T')[0]
      const logsOfDay = waterLogs?.filter(log => 
        log.recorded_at.startsWith(dateStr)
      ) || []
      
      const memoOfDay = conditionMemos?.find(memo => 
        memo.memo_date === dateStr
      ) || null
      
      return {
        date: dateStr,
        logs: logsOfDay,
        logCount: logsOfDay.length,
        intensitySummary: {
          high: logsOfDay.filter(l => l.intensity === 'high').length,
          medium: logsOfDay.filter(l => l.intensity === 'medium').length,
          low: logsOfDay.filter(l => l.intensity === 'low').length,
        },
        conditionMemo: memoOfDay
      }
    })
    
    return { success: true, data: dailyData }
  } catch (error) {
    console.error('히스토리 조회 실패:', error)
    return { success: false, error: '히스토리 조회에 실패했습니다.', data: [] }
  }
}

export async function getDayDetail(date: string) {
  try {
    // 특정 날짜의 상세 기록 조회
    const { data: waterLogs, error: waterError } = await supabase
      .from('water_logs')
      .select('*')
      .gte('recorded_at', `${date}T00:00:00`)
      .lt('recorded_at', `${date}T23:59:59`)
      .order('recorded_at', { ascending: true })
    
    if (waterError) throw waterError
    
    const { data: conditionMemo, error: memoError } = await supabase
      .from('condition_memos')
      .select('*')
      .eq('memo_date', date)
      .single()
    
    if (memoError && memoError.code !== 'PGRST116') throw memoError
    
    return {
      success: true,
      data: {
        date,
        logs: waterLogs || [],
        conditionMemo: conditionMemo || null
      }
    }
  } catch (error) {
    console.error('날짜 상세 조회 실패:', error)
    return { success: false, error: '조회에 실패했습니다.' }
  }
}
```

### 3. 프론트엔드 연동

#### 3.1 CalendarView 컴포넌트 수정
**파일**: `components/features/history/calendar-view.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getMonthlyHistory } from '@/actions/history'
import { format, startOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadHistory()
  }, [currentDate])
  
  const loadHistory = async () => {
    setLoading(true)
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    
    const result = await getMonthlyHistory(year, month)
    if (result.success) {
      setHistoryData(result.data)
    }
    setLoading(false)
  }
  
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }
  
  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {format(currentDate, 'yyyy년 M월', { locale: ko })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-center font-semibold text-sm p-2">
              {day}
            </div>
          ))}
          
          {historyData.map((dayData) => {
            const date = new Date(dayData.date)
            const isToday = dayData.date === new Date().toISOString().split('T')[0]
            
            return (
              <Card
                key={dayData.date}
                className={`p-3 min-h-20 ${isToday ? 'border-water' : ''}`}
              >
                <div className="text-sm font-medium mb-1">
                  {date.getDate()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {dayData.logCount > 0 ? (
                    <div className="flex gap-1">
                      {dayData.intensitySummary.high > 0 && (
                        <span className="text-blue-500">● {dayData.intensitySummary.high}</span>
                      )}
                      {dayData.intensitySummary.medium > 0 && (
                        <span className="text-cyan-500">● {dayData.intensitySummary.medium}</span>
                      )}
                      {dayData.intensitySummary.low > 0 && (
                        <span className="text-gray-400">● {dayData.intensitySummary.low}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </div>
                {dayData.conditionMemo && (
                  <div className="text-xs mt-1">
                    {dayData.conditionMemo.condition_type === 'tired' && '😫'}
                    {dayData.conditionMemo.condition_type === 'swollen' && '😵'}
                    {dayData.conditionMemo.condition_type === 'refreshed' && '😊'}
                    {dayData.conditionMemo.condition_type === 'normal' && '😐'}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

---

## ✅ 완료 체크리스트

- [ ] `app/api/history/route.ts` 구현
- [ ] `actions/history.ts` 구현
- [ ] CalendarView 컴포넌트 수정
- [ ] API 테스트
- [ ] 프론트엔드 통합 테스트
- [ ] 월 변경 네비게이션 확인
- [ ] 날짜별 데이터 표시 확인

---

## 🔗 프론트엔드 연동

### 영향받는 페이지
- 히스토리 페이지 (`/history`)

### 사용하는 컴포넌트
- `components/features/history/calendar-view.tsx`

---

## 📚 참고 문서

- [user_stories.md](../user_stories.md) - US-003, US-004
- [software_design.md](../software_design.md)

---

**작성일**: 2025-12-20  
**의존성**: Task 1 완료 후 시작 가능 (Task 2와 병렬 개발 가능)
