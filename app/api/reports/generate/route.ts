import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { generateWaterIntakeReport } from '@/lib/ai/gemini'
import { subDays } from 'date-fns'

export async function POST(request: NextRequest) {
    try {
        // 환경 변수 검증
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return NextResponse.json(
                { error: 'Supabase 환경 변수가 설정되지 않았습니다.' },
                { status: 500 }
            )
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API 키가 설정되지 않았습니다.' },
                { status: 500 }
            )
        }

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

        // 최소 데이터 검증 (3개 미만이면 리포트 생성 불가)
        if (!waterLogs || waterLogs.length < 3) {
            return NextResponse.json(
                {
                    error: '리포트 생성을 위해 최소 3개 이상의 물 섭취 기록이 필요합니다.',
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
