'use client'

import { useState } from 'react'
import { generateReport } from '@/actions/reports'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

export function ReportGenerator() {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await generateReport()

      if (result.success) {
        toast.success('새로운 AI 리포트가 생성되었습니다!')
        // 목록 갱신을 위해 페이지를 새로고침하거나 상태를 업데이트해야 함
        // Server Action에서 revalidatePath를 호출했으므로 router.refresh() 사용 가능
        window.location.reload()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast.error(error.message || '리포트 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-700">
          <Sparkles className="h-5 w-5" />
          AI 인사이트
        </CardTitle>
        <CardDescription>
          최근 7일간의 물 섭취 패턴과 컨디션을 AI가 분석해드립니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span> 분석 중...
            </span>
          ) : (
            '지금 분석 리포트 받아보기'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
