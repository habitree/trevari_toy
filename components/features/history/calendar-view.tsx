'use client'

import { useState, useEffect } from 'react'
import { getMonthlyHistory } from '@/actions/history'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Droplet, Smile, Frown, Meh, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CONDITION_ICONS = {
  refreshed: Smile,
  normal: Meh,
  tired: Frown,
  swollen: Activity
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [currentDate])

  const loadHistory = async () => {
    setLoading(true)
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1

    const result = await getMonthlyHistory(year, month)
    if (result.success) {
      setHistoryData(result.data)
    }
    setLoading(false)
  }

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {format(currentDate, 'yyyy년 M월', { locale: ko })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <span className="text-muted-foreground">데이터 불러오는 중...</span>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-center font-semibold text-sm p-2 text-muted-foreground">
              {day}
            </div>
          ))}

          {historyData.map((dayData, index) => {
            const date = new Date(dayData.date)
            const isToday = dayData.date === new Date().toISOString().split('T')[0]
            const offset = index === 0 ? date.getDay() : 0 // 첫째 주 시작 요일 처리용 (이 로직은 eachDayOfInterval이 1일부터 주므로 간소화 필요)
            // Note: eachDayOfInterval returns consecutive days. We need to offset the first item manually if we want exact calendar grid, 
            // but for simplicity let's assume standard grid filling or use date.getDay() to place empty cells.

            // To make it a proper calendar, request returned all days of month.
            // We just need to handle empty placeholders for the first week if needed.
            // However, Shadcn Calendar or standard simple grid is fine.
            // Let's keep it simple: mapped logic.
            // We might need empty divs for the first row offset.

            return (
              <Card
                key={dayData.date}
                className={`p-1 md:p-3 min-h-[80px] md:min-h-[100px] flex flex-col justify-between transition-colors hover:bg-muted/50 ${isToday ? 'border-primary border-2' : ''
                  }`}
                style={index === 0 ? { gridColumnStart: date.getDay() + 1 } : {}}
              >
                <div className="text-sm font-medium">
                  {date.getDate()}
                </div>

                <div className="flex flex-col gap-1 items-end">
                  {dayData.logCount > 0 && (
                    <div className="flex gap-0.5">
                      {/* Simplified Dot Representation */}
                      {Array.from({ length: Math.min(dayData.logCount, 5) }).map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < dayData.intensitySummary.high ? 'bg-blue-500' :
                            i < (dayData.intensitySummary.high + dayData.intensitySummary.medium) ? 'bg-cyan-400' :
                              'bg-slate-300'
                          }`} />
                      ))}
                      {dayData.logCount > 5 && <span className="text-[8px] text-muted-foreground">+</span>}
                    </div>
                  )}

                  {dayData.conditionMemo && (
                    <div className="text-xs" title={dayData.conditionMemo.condition_type}>
                      {dayData.conditionMemo.condition_type === 'refreshed' && '😊'}
                      {dayData.conditionMemo.condition_type === 'normal' && '😐'}
                      {dayData.conditionMemo.condition_type === 'tired' && '😫'}
                      {dayData.conditionMemo.condition_type === 'swollen' && '😵'}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
