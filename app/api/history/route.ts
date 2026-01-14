import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        // 환경 변수 검증
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return NextResponse.json(
                { error: 'Supabase 환경 변수가 설정되지 않았습니다.' },
                { status: 500 }
            )
        }

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
