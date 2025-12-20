import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 환경 변수 체크 (개발 환경에서 편의를 위해)
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. API 호출이 실패할 수 있습니다.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
