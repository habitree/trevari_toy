import { IntakeRecorder } from "@/components/features/intake/intake-recorder"
import { TodayIntakeList } from "@/components/features/intake/today-intake-list"
import { ConditionMemo } from "@/components/features/intake/condition-memo"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export default function HomePage() {
  const today = new Date()

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{format(today, "yyyy년 M월 d일", { locale: ko })}</h1>
            <p className="text-muted-foreground">오늘의 물 섭취를 기록해보세요</p>
          </div>

          {/* Intake Recorder */}
          <IntakeRecorder />

          {/* Condition Memo */}
          <ConditionMemo />

          {/* Today's Records */}
          <TodayIntakeList />
        </div>
      </main>
    </div>
  )
}
