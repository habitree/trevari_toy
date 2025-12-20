export type WaterLog = {
    id: string
    recorded_at: string
    intensity: 'high' | 'medium' | 'low'
    created_at: string
    updated_at: string
}

export type ConditionMemo = {
    id: string
    memo_date: string
    condition_type: 'tired' | 'swollen' | 'refreshed' | 'normal' | null
    note: string | null
    created_at: string
    updated_at: string
}

export type AIReport = {
    id: string
    period_start: string
    period_end: string
    content: string
    report_type: 'weekly' | 'on_demand'
    created_at: string
}
