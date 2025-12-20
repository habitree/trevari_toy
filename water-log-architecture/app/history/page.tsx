import { CalendarView } from "@/components/features/history/calendar-view"

export default function HistoryPage() {
  const today = new Date()

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">히스토리</h1>
            <p className="text-muted-foreground">물 섭취 기록을 한눈에 확인하세요</p>
          </div>

          <CalendarView />
        </div>
      </main>
    </div>
  )
}
