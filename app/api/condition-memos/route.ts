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
