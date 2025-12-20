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
