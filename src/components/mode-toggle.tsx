"use client"

import * as React from "react"
import { Moon, Sun, BookOpen } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  // 1. Tambahkan state untuk mengecek apakah komponen sudah terpasang
  const [mounted, setMounted] = React.useState(false)

  // 2. Set mounted ke true setelah komponen muncul di browser
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // 3. Jika belum mounted, jangan rendernya dulu agar server dan client sinkron (kosong)
  if (!mounted) {
    return <div className="w-28 h-10" /> // Beri placeholder kotak kosong dengan ukuran yang sama
  }

  return (
    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-full w-fit shadow-inner border border-slate-200 dark:border-slate-700">
      {/* Light Mode */}
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="icon"
        className="rounded-full w-8 h-8"
        onClick={() => setTheme("light")}
      >
        <Sun className="h-4 w-4" />
      </Button>

      {/* Dark Mode */}
      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size="icon"
        className="rounded-full w-8 h-8"
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-4 w-4" />
      </Button>

      {/* Read Mode */}
      <Button
        variant={theme === "read" ? "secondary" : "ghost"}
        size="icon"
        className={`rounded-full w-8 h-8 ${theme === 'read' ? 'bg-orange-200 text-orange-900' : ''}`}
        onClick={() => setTheme("read")}
      >
        <BookOpen className="h-4 w-4" />
      </Button>
    </div>
  )
}