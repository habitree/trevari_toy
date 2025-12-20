"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react"
import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { ko } from "date-fns/locale"

// Mock data - TODO: Replace with real data
const mockIntakeData: Record<string, number> = {
  "2025-12-15": 3,
  "2025-12-16": 2,
  "2025-12-17": 4,
  "2025-12-18": 1,
  "2025-12-19": 3,
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const startDayOfWeek = getDay(monthStart)
  const emptyDays = Array.from({ length: startDayOfWeek }, (_, i) => i)

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const getIntakeLevel = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const count = mockIntakeData[dateStr] || 0
    if (count >= 3) return "high"
    if (count >= 1) return "medium"
    return "none"
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{format(currentDate, "yyyy년 M월", { locale: ko })}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day labels */}
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {emptyDays.map((i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Calendar days */}
          {daysInMonth.map((date) => {
            const intakeLevel = getIntakeLevel(date)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isCurrentDay = isToday(date)

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square p-2 rounded-lg border transition-all
                  ${isSelected ? "border-water bg-water/10" : "border-border hover:border-water/50"}
                  ${isCurrentDay ? "ring-2 ring-water/30" : ""}
                  ${!isSameMonth(date, currentDate) ? "opacity-30" : ""}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-sm mb-1">{format(date, "d")}</span>
                  {intakeLevel !== "none" && (
                    <div className="flex gap-0.5">
                      <Droplets className={`h-3 w-3 ${intakeLevel === "high" ? "text-water" : "text-water/40"}`} />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{format(selectedDate, "M월 d일", { locale: ko })} 상세 기록</h3>
          <div className="space-y-2 text-muted-foreground">
            <p>이 날의 기록을 확인할 수 있어요</p>
            {/* TODO: Add detailed records for selected date */}
          </div>
        </Card>
      )}
    </div>
  )
}
