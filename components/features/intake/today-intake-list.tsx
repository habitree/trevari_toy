'use client'

import { useEffect, useState } from 'react'
import { getTodayWaterLogs, deleteWaterLog } from '@/actions/water-logs'
import { WaterLog } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Trash2, Droplets } from 'lucide-react'
import { toast } from 'sonner'

export function TodayIntakeList() {
  const [logs, setLogs] = useState<WaterLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    const result = await getTodayWaterLogs()
    if (result.success) {
      setLogs(result.data || [])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const result = await deleteWaterLog(id)
    if (result.success) {
      toast.success('기록이 삭제되었습니다.')
      loadLogs()
    } else {
      toast.error('삭제에 실패했습니다.')
    }
  }

  if (loading) return <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
  if (logs.length === 0) return (
    <div className="text-center py-8 border rounded-lg bg-muted/20">
      <p className="text-muted-foreground">오늘 기록이 없습니다.</p>
      <p className="text-xs text-muted-foreground mt-1">물을 마시고 기록해보세요!</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">오늘의 기록</h3>
        <span className="text-sm text-muted-foreground">{logs.length}회</span>
      </div>
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${log.intensity === 'high' ? 'bg-blue-100 text-blue-600' :
                  log.intensity === 'medium' ? 'bg-cyan-100 text-cyan-600' :
                    'bg-gray-100 text-gray-500'
                }`}>
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">
                  {format(new Date(log.recorded_at), 'a h:mm', { locale: ko })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {log.intensity === 'high' && '마셨음'}
                  {log.intensity === 'medium' && '조금 마셨음'}
                  {log.intensity === 'low' && '거의 안 마셨음'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(log.id)}
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">삭제</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
