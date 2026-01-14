import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function PATCH(
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
        const { intensity } = await request.json()

        const { data, error } = await supabase
            .from('water_logs')
            .update({ intensity })
            .eq('id', id)
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
        const { error } = await supabase
            .from('water_logs')
            .delete()
            .eq('id', id)

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
