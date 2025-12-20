'use client'

import { useEffect, useState } from 'react'
import { getReports } from '@/actions/reports'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { FileText, Calendar } from 'lucide-react'

export function ReportList() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    const result = await getReports()
    if (result.success) {
      setReports(result.data || [])
    }
    setLoading(false)
  }

  if (loading) return <div className="text-center py-8 text-muted-foreground">리포트 불러오는 중...</div>

  if (reports.length === 0) return (
    <div className="text-center py-12 border rounded-lg bg-muted/20">
      <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
      <p className="text-muted-foreground">아직 생성된 리포트가 없습니다.</p>
      <p className="text-sm text-muted-foreground mt-1">3일 이상 기록 후 리포트를 생성해보세요!</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-500" />
        지난 리포트 보관함
      </h3>
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="overflow-hidden transition-all hover:bg-accent/5">
            <CardHeader className="bg-muted/30 py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span>
                    {format(new Date(report.period_start), 'M월 d일', { locale: ko })}
                    {' ~ '}
                    {format(new Date(report.period_end), 'M월 d일', { locale: ko })}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white border">
                    {report.report_type === 'weekly' ? '정기 리포트' : '요청 리포트'}
                  </span>
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(report.created_at), 'M.d HH:mm', { locale: ko })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {report.content}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
