'use client'

import { useState } from 'react'
import { createWaterLog } from '@/actions/water-logs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { WaterAnimation } from "@/components/ui/water-animation"

interface IntakeRecorderProps {
  selectedDate: Date
}

export function IntakeRecorder({ selectedDate }: IntakeRecorderProps) {
  const [loading, setLoading] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  const handleRecord = async (intensity: 'high' | 'medium' | 'low') => {
    // 애니메이션 시작 (즉각적인 피드백)
    setShowAnimation(true)

    setLoading(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const result = await createWaterLog(intensity, dateStr)

      if (result.success) {
        // 애니메이션이 충분히 보일 때까지 약간의 딜레이 후 토스트 (선택사항)
        setTimeout(() => toast.success('물 섭취가 기록되었습니다.'), 1000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('기록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <WaterAnimation
        isVisible={showAnimation}
        onComplete={() => setShowAnimation(false)}
      />

      <h3 className="font-semibold text-lg">물을 마셨나요?</h3>
      <div className="grid grid-cols-3 gap-4 relative z-10">
        <Button
          onClick={() => handleRecord('high')}
          disabled={loading}
          className="h-16 text-lg hover:bg-blue-600 active:bg-blue-700 bg-blue-500 relative z-20 cursor-pointer shadow-sm"
        >
          마셨음
          <span className="sr-only">충분히 마심</span>
        </Button>
        <Button
          onClick={() => handleRecord('medium')}
          disabled={loading}
          className="h-16 text-lg border-2 border-blue-200 bg-white text-blue-700 hover:bg-blue-50 relative z-20 cursor-pointer shadow-sm pointer-events-auto"
        >
          조금
          <span className="sr-only">조금 마심</span>
        </Button>
        <Button
          onClick={() => handleRecord('low')}
          disabled={loading}
          className="h-16 text-lg border-2 border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 relative z-20 cursor-pointer shadow-sm pointer-events-auto"
        >
          안 마심
          <span className="sr-only">거의 안 마심</span>
        </Button>
      </div>
    </div>
  )
}
