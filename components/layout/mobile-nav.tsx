"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, History, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "홈", href: "/", icon: Home },
  { name: "히스토리", href: "/history", icon: History },
  { name: "AI 리포트", href: "/reports", icon: FileText },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[80px]",
                isActive ? "text-water" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
