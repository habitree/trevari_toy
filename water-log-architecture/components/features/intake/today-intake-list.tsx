"use client"

import { Card } from "@/components/ui/card"
import { Droplets, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Mock data - TODO: Replace with real data from Supabase
const mockRecords = [
  { id: "1", level: "high", time: "14:30", label: "마셨음" },
  { id: "2", level: "medium", time: "10:15", label: "조금 마셨음" },
  { id: "3", level: "high", time: "08:00", label: "마셨음" },
]

export function TodayIntakeList() {
  const handleDelete = (id: string) => {
    // TODO: Server Action으로 삭제
    console.log("Deleting:", id)
  }

  if (mockRecords.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">
          <Droplets className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>아직 기록이 없어요</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">오늘의 기록</h3>
      <div className="space-y-3">
        {mockRecords.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Droplets
                className={`h-5 w-5 ${
                  record.level === "high" ? "text-water" : record.level === "medium" ? "text-water/60" : "text-water/30"
                }`}
              />
              <div>
                <div className="font-medium">{record.label}</div>
                <div className="text-sm text-muted-foreground">{record.time}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(record.id)}
              className="hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}
