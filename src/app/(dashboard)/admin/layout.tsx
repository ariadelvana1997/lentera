"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, Users, GraduationCap, 
  BookOpen, Settings, LogOut, Flame, Menu, X,
  ChevronLeft, ChevronRight, Bell
} from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const menu = [
    { name: "Beranda", href: "/admin", icon: LayoutDashboard },
    { name: "Data Siswa", href: "/admin/siswa", icon: Users },
    { name: "Data Guru", href: "/admin/guru", icon: GraduationCap },
    { name: "Mata Pelajaran", href: "/admin/mapel", icon: BookOpen },
    { name: "Pengaturan", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-background font-sans transition-colors duration-1000 overflow-hidden">
      
      {/* --- SIDEBAR MOBILE (DRAWER) --- */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`} 
        onClick={() => setIsMobileOpen(false)} 
      />
      
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-card border-r shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-xl">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">LENTERA</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsMobileOpen(false)}>
              <X className="w-6 h-6" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1">
            {menu.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setIsMobileOpen(false)}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  pathname === item.href 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground active:bg-muted"
                }`}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t mt-auto">
            <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 h-12 rounded-xl">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-semibold">Keluar Aplikasi</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside 
        className={`hidden md:flex flex-col sticky top-0 h-screen border-r bg-card/30 backdrop-blur-md transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 bg-background border rounded-full p-1 hover:bg-muted transition-colors shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`p-6 flex items-center transition-all ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="bg-amber-500 p-2 rounded-xl shrink-0">
            <Flame className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && <span className="font-bold text-xl tracking-tight animate-in fade-in duration-500">LENTERA</span>}
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4">
          {menu.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center transition-all duration-200 group
                  ${isCollapsed ? "justify-center h-12 w-12 mx-auto rounded-2xl" : "gap-3 px-4 py-3 rounded-xl"}
                  ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"}
                `}>
                  <item.icon className={`w-5 h-5 shrink-0 ${!active && "group-hover:scale-110 transition-transform"}`} />
                  {!isCollapsed && <span className="font-medium text-sm animate-in slide-in-from-left-1">{item.name}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <Button variant="ghost" className={`w-full flex items-center text-red-500 hover:bg-red-50 rounded-xl h-11 ${
            isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-4"
          }`}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-sm font-semibold">Keluar</span>}
          </Button>
        </div>
      </aside>

      {/* --- MAIN AREA (FIXED FOR MOBILE FIT) --- */}
      <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-8 sticky top-0 bg-background/80 backdrop-blur-md z-40 transition-all">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-foreground shrink-0" 
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="font-bold text-foreground text-sm md:text-base truncate">
               {isCollapsed ? "Admin" : "Dashboard Admin"}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
            {/* ModeToggle dikurangi sedikit skalanya agar lebih proporsional di mobile */}
            <div className="scale-90 md:scale-100 origin-right">
              <ModeToggle />
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-border/50 ml-1">
                <div className="text-right hidden sm:block leading-none">
                   <p className="text-[10px] font-bold uppercase text-amber-600 mb-0.5">Admin</p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-amber-500/10 shrink-0">
                   AD
                </div>
            </div>
          </div>
        </header>
        
        {/* Content Container (Fit & Scrollable) */}
        <div className="p-4 md:p-8 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/30 dark:bg-transparent">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}