'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase/client'

export async function createWaterLog(intensity: 'high' | 'medium' | 'low') {
    try {
        const { data, error } = await supabase
            .from('water_logs')
            .insert({ intensity })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/')
        return { success: true, data }
    } catch (error) {
        console.error('물 섭취 기록 생성 실패:', error)
        return { success: false, error: '기록 생성에 실패했습니다.' }
    }
}

export async function getTodayWaterLogs() {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
            .from('water_logs')
            .select('*')
            .gte('recorded_at', today.toISOString())
            .order('recorded_at', { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('오늘 기록 조회 실패:', error)
        return { success: false, error: '기록 조회에 실패했습니다.', data: [] }
    }
}

export async function updateWaterLog(id: string, intensity: 'high' | 'medium' | 'low') {
    try {
        const { data, error } = await supabase
            .from('water_logs')
            .update({ intensity })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/')
        return { success: true, data }
    } catch (error) {
        console.error('물 섭취 기록 수정 실패:', error)
        return { success: false, error: '기록 수정에 실패했습니다.' }
    }
}

export async function deleteWaterLog(id: string) {
    try {
        const { error } = await supabase
            .from('water_logs')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('물 섭취 기록 삭제 실패:', error)
        return { success: false, error: '기록 삭제에 실패했습니다.' }
    }
}
