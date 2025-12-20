"use client"

import { Card } from "@/components/ui/card"
import { FileText } from "lucide-react"

// Mock data - TODO: Replace with real data
const mockReports = [
  {
    id: "1",
    title: "12월 3주차 리포트",
    period: "2025-12-13 ~ 12-19",
    preview:
      "완벽하진 않았지만, 지난주보다 오후 물 섭취 빈도가 늘었어요. 특히 화요일과 목요일 오후 3시경에 꾸준히 마신 점이 인상적이에요.",
    createdAt: "2025-12-19",
  },
  {
    id: "2",
    title: "12월 2주차 리포트",
    period: "2025-12-06 ~ 12-12",
    preview: "물이 적었던 날에 피로 메모가 자주 등장했어요. 오전에 물을 마신 날이 오후 컨디션이 더 좋았던 것 같아요.",
    createdAt: "2025-12-12",
  },
]

export function ReportList() {
  if (mockReports.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>아직 생성된 리포트가 없어요</p>
          <p className="text-sm mt-1">최소 3일의 기록이 있으면 리포트를 생성할 수 있어요</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">최근 리포트</h3>
      {mockReports.map((report) => (
        <Card key={report.id} className="p-6 hover:border-water/50 transition-colors cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-water/10">
              <FileText className="h-5 w-5 text-water" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-semibold">{report.title}</h4>
                <p className="text-sm text-muted-foreground">{report.period}</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{report.preview}</p>
              <p className="text-xs text-muted-foreground">생성일: {report.createdAt}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
