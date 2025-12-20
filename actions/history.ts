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
