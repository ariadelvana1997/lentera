"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, BookOpen, FileText, Settings, 
  LogOut, Flame, ChevronLeft, ChevronRight, EyeOff, Loader2,
  Menu, X, LockKeyhole, Baby, Ghost 
} from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { LanguageProvider } from "@/context/language-context"
import { toast } from "sonner" 

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // --- STATE PRIVASI ---
  const [isPrivacyLocked, setIsPrivacyLocked] = useState(false)
  const [privacyPass, setPrivacyPass] = useState("")
  const [lockError, setLockError] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleUnlock = async () => {
    setIsUnlocking(true)
    setLockError(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: privacyPass
      })
      if (!error) {
        setIsPrivacyLocked(false)
        setPrivacyPass("")
      } else {
        setLockError(true)
      }
    }
    setIsUnlocking(false)
  }

  const menu = [
    { name: "Dashboard", href: "/guru", icon: LayoutDashboard },
    { name: "Data Mata Pelajaran", href: "/guru/mapel", icon: BookOpen },
    { name: "Data Penilaian", href: "/guru/penilaian", icon: FileText },
    { name: "Pengaturan", href: "/guru/settings", icon: Settings },
  ]

  if (!mounted) return null

  return (
    <LanguageProvider>
    <div className="flex min-h-screen bg-background font-sans overflow-hidden text-foreground  transition-all duration-300">
      
      {/* --- X-PRIVASI: LOCK SCREEN OVERLAY --- */}
      {isPrivacyLocked && (
        <div className="fixed inset-0 z-[200] bg-background/90 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-500">
          <div className="max-w-sm w-full p-10 text-center space-y-8">
            <div className="relative mx-auto w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-inner">
               <LockKeyhole className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
               <h2 className="text-2xl font-black uppercase tracking-tighter ">Sistem Terkunci</h2>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Masukkan Password Guru Anda</p>
            </div>
            <div className="space-y-4">
               <Input 
                 type="password" 
                 placeholder="••••••••" 
                 className={`text-center h-14 rounded-2xl border-none bg-muted/50 font-black tracking-[0.5em] transition-all ${lockError ? "ring-2 ring-red-500 animate-shake" : "focus:ring-2 focus:ring-primary"}`}
                 value={privacyPass}
                 onChange={(e) => setPrivacyPass(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
               />
               <Button onClick={handleUnlock} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20" disabled={isUnlocking}>
                 {isUnlocking ? <Loader2 className="animate-spin w-5 h-5" /> : "BUKA AKSES"}
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR MOBILE (OVERLAY) --- */}
      <div 
        className={`fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} 
        onClick={() => setIsMobileOpen(false)}
      >
        <aside 
          className={`w-72 h-full bg-card border-r p-6 transform transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20"><Flame className="w-5 h-5 text-white" /></div>
              <span className="font-black text-2xl uppercase text-primary">LENTERA</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsMobileOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="space-y-2">
            {menu.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setIsMobileOpen(false)}>
                <div className={`flex items-center p-4 rounded-2xl transition-all gap-3 ${pathname === item.href ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"}`}>
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-tight">{item.name}</span>
                </div>
              </Link>
            ))}
          </nav>
        </aside>
      </div>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className={`hidden md:flex flex-col sticky top-0 h-screen border-r bg-card/30 backdrop-blur-md transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"}`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-10 bg-background border rounded-full p-1 z-50 shadow-sm">
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div className={`p-8 flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20"><Flame className="w-5 h-5 text-white" /></div>
          {!isCollapsed && <span className="font-black text-2xl tracking-tighter uppercase text-primary text-shadow-glow">LENTERA</span>}
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menu.map((item) => (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center p-3 rounded-2xl transition-all ${isCollapsed ? "justify-center" : "gap-3"} ${pathname === item.href ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-muted"}`}>
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-tight truncate">{item.name}</span>}
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-primary/5 text-center">
            <Button variant="ghost" className={`w-full justify-start gap-3 text-red-500 rounded-2xl h-12 ${isCollapsed ? "justify-center" : ""}`} onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? <Loader2 className="animate-spin w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                {!isCollapsed && <span className="font-black uppercase text-[11px]">Keluar</span>}
            </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {/* --- HEADER SUPER RESPONSIVE (FIXED) --- */}
        <header className="h-20 border-b flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          
          {/* TAMPILAN MOBILE (md:hidden) */}
          <div className="flex items-center justify-between w-full md:hidden">
            {/* Kiri: Hamburger & Judul Terpotong (Elipsis) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl bg-muted/50 w-9 h-9" 
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="font-black uppercase tracking-tighter text-[15px] leading-none whitespace-nowrap max-w-[65px] truncate ">
                 POR<span className="text-primary">TAL GURU</span>
              </h2>
            </div>

            {/* Kanan: Unified Control Pill & Avatar Bulat */}
            <div className="flex items-center gap-2">
               {/* Control Pill (Menyatukan ModeToggle, Baby, EyeOff) */}
               <div className="bg-muted/50 rounded-full flex items-center p-1 gap-0.5 border border-border/20 shadow-inner">
                  <ModeToggle />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:text-primary w-8 h-8" 
                    onClick={() => toast.info("Fitur ini sedang dikembangkan", {
                      description: "Mode Anak akan segera hadir di Multiverse LENTERA.",
                      icon: <Baby className="w-4 h-4 text-primary" />,
                    })}
                  >
                    <Baby className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:text-primary w-8 h-8" 
                    onClick={() => setIsPrivacyLocked(true)}
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
               </div>
               {/* Avatar Inisial Bulat */}
               <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-black  shadow-lg shadow-primary/20 text-[10px] shrink-0">
                  GR
               </div>
            </div>
          </div>

          {/* TAMPILAN DESKTOP (hidden md:flex) */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <h2 className="font-black uppercase tracking-tighter text-xl leading-none  whitespace-nowrap">
                 PORTAL <span className="text-primary">GURU</span>
              </h2>
              <div className="flex items-center gap-1 border-l pl-4 border-border/50">
                <Button 
                   variant="ghost" size="icon" className="rounded-xl hover:text-primary transition-all" 
                   onClick={() => toast.info("Fitur ini sedang dikembangkan", { icon: <Baby className="w-4 h-4 text-primary" /> })}
                >
                   <Baby className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl hover:text-primary transition-all" onClick={() => setIsPrivacyLocked(true)}>
                   <EyeOff className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 border-l pl-4 border-border/50">
               <ModeToggle />
               <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black  shadow-lg shadow-primary/20 shrink-0">
                  GR
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/30 dark:bg-transparent">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
    </LanguageProvider>
  )
}