import { ReportList } from "@/components/features/reports/report-list"
import { ReportGenerator } from "@/components/features/reports/report-generator"

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">AI 리포트</h1>
            <p className="text-muted-foreground">AI가 분석한 물 섭취 패턴을 확인하세요</p>
          </div>

          <ReportGenerator />

          <ReportList />
        </div>
      </main>
    </div>
  )
}
