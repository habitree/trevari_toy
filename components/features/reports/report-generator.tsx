'use client'

import { useState } from 'react'
import { generateReport } from '@/actions/reports'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Sparkles, CalendarIcon } from 'lucide-react'
import { format, subDays } from 'date-fns'

type PeriodOption = '7days' | '30days' | 'custom'

export function ReportGenerator() {
  const [loading, setLoading] = useState(false)
  const [periodOption, setPeriodOption] = useState<PeriodOption>('7days')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined)
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const handleGenerate = async () => {
    let periodStart: string | undefined
    let periodEnd: string | undefined

    // 기간 계산
    if (periodOption === '7days') {
      const end = new Date()
      const start = subDays(end, 6)
      periodStart = start.toISOString().split('T')[0]
      periodEnd = end.toISOString().split('T')[0]
    } else if (periodOption === '30days') {
      const end = new Date()
      const start = subDays(end, 29)
      periodStart = start.toISOString().split('T')[0]
      periodEnd = end.toISOString().split('T')[0]
    } else if (periodOption === 'custom') {
      if (!customStartDate || !customEndDate) {
        toast.error('시작일과 종료일을 모두 선택해주세요.')
        return
      }
      periodStart = customStartDate.toISOString().split('T')[0]
      periodEnd = customEndDate.toISOString().split('T')[0]
    }

    setLoading(true)
    try {
      const result = await generateReport(periodStart, periodEnd)

      if (result.success) {
        toast.success('새로운 AI 리포트가 생성되었습니다!')
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

  const getPeriodDescription = () => {
    if (periodOption === '7days') {
      return '최근 7일간의 물 섭취 패턴과 컨디션을 AI가 분석해드립니다.'
    } else if (periodOption === '30days') {
      return '최근 30일간의 물 섭취 패턴과 컨디션을 AI가 분석해드립니다.'
    } else {
      return '선택한 기간의 물 섭취 패턴과 컨디션을 AI가 분석해드립니다.'
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
          {getPeriodDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="period-select" className="text-sm font-medium">
            분석 기간 선택
          </Label>
          <Select
            value={periodOption}
            onValueChange={(value) => setPeriodOption(value as PeriodOption)}
          >
            <SelectTrigger id="period-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">최근 7일</SelectItem>
              <SelectItem value="30days">최근 30일</SelectItem>
              <SelectItem value="custom">기간 직접 선택</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {periodOption === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">시작일</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? (
                      format(customStartDate, 'yyyy-MM-dd')
                    ) : (
                      <span className="text-muted-foreground">시작일 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={(date) => {
                      setCustomStartDate(date)
                      setStartDateOpen(false)
                    }}
                    disabled={(date) => date > new Date() || date > (customEndDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">종료일</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? (
                      format(customEndDate, 'yyyy-MM-dd')
                    ) : (
                      <span className="text-muted-foreground">종료일 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={(date) => {
                      setCustomEndDate(date)
                      setEndDateOpen(false)
                    }}
                    disabled={(date) => 
                      date > new Date() || 
                      (customStartDate ? date < customStartDate : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || (periodOption === 'custom' && (!customStartDate || !customEndDate))}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span> 분석 중...
            </span>
          ) : (
            '분석 리포트 받아보기'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
