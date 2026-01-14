import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 환경 변수 검증
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return NextResponse.json(
                { error: 'Supabase 환경 변수가 설정되지 않았습니다.' },
                { status: 500 }
            )
        }

        const id = (await params).id
        const { data, error } = await supabase
            .from('ai_reports')
            .select('*')
            .eq('id', id)
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
