'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase/client'

export async function saveConditionMemo(
    memoDate: string,
    conditionType: 'tired' | 'swollen' | 'refreshed' | 'normal' | null,
    note?: string
) {
    try {
        const { data, error } = await supabase
            .from('condition_memos')
            .upsert({
                memo_date: memoDate,
                condition_type: conditionType,
                note: note || null
            }, {
                onConflict: 'memo_date'
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/')
        return { success: true, data }
    } catch (error) {
        console.error('컨디션 메모 저장 실패:', error)
        return { success: false, error: '메모 저장에 실패했습니다.' }
    }
}

export async function getTodayConditionMemo() {
    try {
        const today = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('condition_memos')
            .select('*')
            .eq('memo_date', today)
            .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

        return { success: true, data: data || null }
    } catch (error) {
        console.error('컨디션 메모 조회 실패:', error)
        return { success: false, error: '메모 조회에 실패했습니다.', data: null }
    }
}
