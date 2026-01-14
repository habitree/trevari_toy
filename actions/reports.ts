'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase/client'
import { generateWaterIntakeReport } from '@/lib/ai/gemini'
import { subDays } from 'date-fns'

export async function generateReport(periodStart?: string, periodEnd?: string) {
    try {
        // 기간이 제공되면 사용, 아니면 기본값(최근 7일)
        const end = periodEnd ? new Date(periodEnd) : new Date()
        const start = periodStart ? new Date(periodStart) : subDays(end, 6)

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
