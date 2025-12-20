"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, History, FileText, Droplets } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "홈", href: "/", icon: Home },
  { name: "히스토리", href: "/history", icon: History },
  { name: "AI 리포트", href: "/reports", icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
      <div className="flex-1 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-water/10">
              <Droplets className="h-6 w-6 text-water" />
            </div>
            <span className="text-xl font-bold">Water Log</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-water/10 text-water font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">실패하지 않는 물 섭취 기록</p>
        </div>
      </div>
    </aside>
  )
}
