'use client'

import { useState, useEffect } from 'react'
import { saveConditionMemo, getTodayConditionMemo } from '@/actions/condition-memos'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Smile, Frown, Meh, Activity } from 'lucide-react'

const CONDITIONS = [
    { value: 'refreshed', label: '개운함', icon: Smile, color: 'text-green-500' },
    { value: 'normal', label: '보통', icon: Meh, color: 'text-yellow-500' },
    { value: 'tired', label: '피로함', icon: Frown, color: 'text-orange-500' },
    { value: 'swollen', label: '붓기', icon: Activity, color: 'text-red-500' },
] as const

export function ConditionMemo() {
    const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [hasRecorded, setHasRecorded] = useState(false)

    useEffect(() => {
        loadTodayMemo()
    }, [])

    const loadTodayMemo = async () => {
        const result = await getTodayConditionMemo()
        if (result.success && result.data) {
            setSelectedCondition(result.data.condition_type)
            setNote(result.data.note || '')
            setHasRecorded(true)
        }
    }

    const handleSave = async () => {
        if (!selectedCondition) return

        setLoading(true)
        try {
            const today = new Date().toISOString().split('T')[0]
            const result = await saveConditionMemo(
                today,
                selectedCondition as any,
                note
            )

            if (result.success) {
                toast.success('오늘의 컨디션이 기록되었습니다.')
                setHasRecorded(true)
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            toast.error(error.message || '저장에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
            <CardHeader className="px-0 sm:px-6">
                <CardTitle className="text-lg">오늘 컨디션은 어땠어요?</CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-6 space-y-4">
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                    {CONDITIONS.map((condition) => {
                        const Icon = condition.icon
                        const isSelected = selectedCondition === condition.value

                        return (
                            <Button
                                key={condition.value}
                                variant={isSelected ? 'default' : 'outline'}
                                onClick={() => setSelectedCondition(condition.value)}
                                className={`h-auto py-3 flex flex-col gap-2 transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:bg-accent'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-foreground' : condition.color}`} />
                                <span className="text-xs">{condition.label}</span>
                            </Button>
                        )
                    })}
                </div>

                <div className="space-y-2">
                    <Textarea
                        placeholder="상세한 메모를 남겨보세요 (선택사항)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="min-h-[80px] resize-none"
                    />
                </div>

                <Button
                    onClick={handleSave}
                    disabled={!selectedCondition || loading}
                    className="w-full"
                    size="lg"
                >
                    {loading ? '저장 중...' : hasRecorded ? '수정하기' : '저장하기'}
                </Button>
            </CardContent>
        </Card>
    )
}
