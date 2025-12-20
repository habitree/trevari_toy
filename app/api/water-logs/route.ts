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
