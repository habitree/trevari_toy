'use client'

import { useState } from 'react'
import { IntakeRecorder } from "@/components/features/intake/intake-recorder"
import { TodayIntakeList } from "@/components/features/intake/today-intake-list"
import { ConditionMemo } from "@/components/features/intake/condition-memo"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {format(selectedDate, "yyyy년 M월 d일")}
                </h1>
                <p className="text-muted-foreground">
                  {isToday ? '오늘의 물 섭취를 기록해보세요' : '선택한 날짜의 물 섭취를 기록해보세요'}
                </p>
              </div>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    날짜 선택
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date)
                        setDatePickerOpen(false)
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {!isToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="text-sm"
              >
                오늘로 돌아가기
              </Button>
            )}
          </div>

          {/* Intake Recorder */}
          <IntakeRecorder selectedDate={selectedDate} />

          {/* Condition Memo */}
          <ConditionMemo selectedDate={selectedDate} />

          {/* Today's Records */}
          <TodayIntakeList selectedDate={selectedDate} />
        </div>
      </main>
    </div>
  )
}
