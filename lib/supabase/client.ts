import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 환경 변수 체크
if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. API 호출이 실패할 수 있습니다.')
    }
}

// 환경 변수가 없어도 클라이언트는 생성하되, 실제 호출 시 오류가 발생하도록 함
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
)

export type Database = {
    public: {
        Tables: {
            water_logs: {
                Row: import('./types').WaterLog
                Insert: Omit<import('./types').WaterLog, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<import('./types').WaterLog, 'id' | 'created_at' | 'updated_at'>>
            }
            condition_memos: {
                Row: import('./types').ConditionMemo
                Insert: Omit<import('./types').ConditionMemo, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<import('./types').ConditionMemo, 'id' | 'created_at' | 'updated_at'>>
            }
            ai_reports: {
                Row: import('./types').AIReport
                Insert: Omit<import('./types').AIReport, 'id' | 'created_at'>
                Update: Partial<Omit<import('./types').AIReport, 'id' | 'created_at'>>
            }
        }
    }
}
