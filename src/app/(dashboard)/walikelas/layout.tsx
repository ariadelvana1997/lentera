"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, Database, Star, ClipboardCheck, Printer, Settings, 
  LogOut, Flame, ChevronLeft, ChevronRight, ChevronDown, 
  BookOpen, Music, FileText, Trophy, CalendarCheck, 
  EyeOff, LockKeyhole, Loader2, Zap, ShieldCheck, Layers, BookOpenText,
  Menu, X, Baby
} from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { LanguageProvider } from "@/context/language-context"
import { toast } from "sonner"

export default function WaliKelasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  const [isPrivacyLocked, setIsPrivacyLocked] = useState(false)
  const [privacyPass, setPrivacyPass] = useState("")
  const [lockError, setLockError] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const toggleSubmenu = (name: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }))
  }

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
      const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: privacyPass })
      if (!error) { 
        setIsPrivacyLocked(false); 
        setPrivacyPass(""); 
      } 
      else { setLockError(true); }
    }
    setIsUnlocking(false)
  }

  const menuWaliKelas = [
    { name: "Dashboard", href: "/walikelas", icon: LayoutDashboard },
    { 
      name: "Master Referensi", 
      icon: Database,
      isSubmenu: true,
      submenus: [
        { name: "Data Mata Pelajaran", href: "/walikelas/referensi/mapel", icon: BookOpen },
        { name: "Data Ekstrakurikuler", href: "/walikelas/referensi/ekskul", icon: Music },
      ]
    },
    { 
      name: "Penilaian Ko-Kurikuler", 
      icon: Star,
      isSubmenu: true,
      submenus: [
        { name: "Input Nilai Kokurikuler", href: "/walikelas/kokurikuler/input", icon: Zap },
        { name: "Deskripsi Kokurikuler", href: "/walikelas/kokurikuler/deskripsi", icon: BookOpenText },
      ]
    },
    { 
      name: "Master Penilaian", 
      icon: ClipboardCheck,
      isSubmenu: true,
      submenus: [
        { name: "Penilaian", href: "/walikelas/master-penilaian/input", icon: ShieldCheck },
        { name: "Ekstrakurikuler", href: "/walikelas/master-penilaian/ekskul", icon: Trophy },
        { name: "Absensi Catatan", href: "/walikelas/master-penilaian/absensi", icon: CalendarCheck },
        { name: "Leger", href: "/walikelas/master-penilaian/leger", icon: Layers },
      ]
    },
    { name: "Cetak Rapor", href: "/walikelas/cetak-rapor", icon: Printer },
    { name: "Pengaturan", href: "/walikelas/settings", icon: Settings },
  ]

  if (!mounted) return null

  return (
    <LanguageProvider>
    <div className="flex min-h-screen bg-background font-sans overflow-hidden text-foreground  transition-all duration-300">
      
      {/* --- X-PRIVASI --- */}
      {isPrivacyLocked && (
        <div className="fixed inset-0 z-[200] bg-background/90 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-500">
          <div className="max-w-sm w-full p-10 text-center space-y-8">
            <div className="relative mx-auto w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-inner">
               <LockKeyhole className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none ">Portal <span className="text-primary">Wali Kelas</span> Locked</h2>
            <div className="space-y-4">
               <Input 
                 type="password" placeholder="••••••••" 
                 className={`text-center h-14 rounded-2xl border-none bg-muted/50 font-black tracking-[0.5em] transition-all ${lockError ? "ring-2 ring-red-500 animate-shake" : "focus:ring-2 focus:ring-primary"}`}
                 value={privacyPass} onChange={(e) => setPrivacyPass(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
               />
               <Button onClick={handleUnlock} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20" disabled={isUnlocking}>
                 {isUnlocking ? <Loader2 className="animate-spin w-5 h-5" /> : "BUKA AKSES"}
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR MOBILE --- */}
      <div 
        className={`fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm md:hidden transition-all duration-300 ${isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} 
        onClick={() => setIsMobileOpen(false)}
      >
        <aside 
          className={`w-72 h-full bg-card border-r transform transition-all duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`} 
          onClick={e => e.stopPropagation()}
        >
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20"><Flame className="w-5 h-5 text-white" /></div>
              <span className="font-black text-2xl uppercase text-primary">LENTERA</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsMobileOpen(false)}><X className="w-5 h-5" /></Button>
          </div>
          
          <ScrollArea className="h-[calc(100vh-140px)] px-4 pb-10">
             <nav className="space-y-2">
                {menuWaliKelas.map((item) => (
                    <div key={item.name}>
                        {item.isSubmenu ? (
                            <div className="space-y-1">
                                <button 
                                  onClick={() => setOpenMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }))} 
                                  className="w-full flex items-center justify-between p-4 rounded-2xl text-muted-foreground hover:bg-muted transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-tight">{item.name}</span>
                                    </div>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${openMenus[item.name] ? "rotate-180" : ""}`} />
                                </button>
                                {openMenus[item.name] && item.submenus?.map(sub => (
                                    <Link key={sub.name} href={sub.href || "#"} onClick={() => setIsMobileOpen(false)}>
                                        <div className={`flex items-center gap-3 py-3 px-10 rounded-xl text-[10px] font-black uppercase transition-all ${pathname === sub.href ? "text-primary bg-primary/5" : "text-muted-foreground"}`}>
                                            <sub.icon className="w-3.5 h-3.5" />
                                            <span>{sub.name}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <Link href={item.href || "#"} onClick={() => setIsMobileOpen(false)}>
                                <div className={`flex items-center p-4 rounded-2xl transition-all gap-3 ${pathname === item.href ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"}`}>
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-tight">{item.name}</span>
                                </div>
                            </Link>
                        )}
                    </div>
                ))}
             </nav>
          </ScrollArea>
        </aside>
      </div>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className={`hidden md:flex flex-col sticky top-0 h-screen border-r bg-card/30 backdrop-blur-md transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"}`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-10 bg-background border rounded-full p-1 z-50 shadow-sm hover:bg-muted">
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div className={`p-8 flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20"><Flame className="w-5 h-5 text-white" /></div>
          {!isCollapsed && <span className="font-black text-xl tracking-tighter uppercase text-primary text-shadow-glow leading-none ">PORTAL<br/>WALI KELAS</span>}
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto scrollbar-hide">
          {menuWaliKelas.map((item) => (
            <div key={item.name}>
              {item.isSubmenu ? (
                <>
                  <button onClick={() => toggleSubmenu(item.name)} className={`w-full flex items-center p-3 rounded-2xl transition-all ${isCollapsed ? "justify-center" : "justify-between"} ${pathname.includes(item.name.toLowerCase().split(' ')[0]) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-tight">{item.name}</span>}
                    </div>
                    {!isCollapsed && <ChevronDown className={`w-3 h-3 transition-transform ${openMenus[item.name] ? "rotate-180" : ""}`} />}
                  </button>
                  {!isCollapsed && openMenus[item.name] && (
                    <div className="mt-2 ml-6 space-y-1 border-l-2 border-primary/10 pl-4 animate-in slide-in-from-top-2">
                      {item.submenus?.map((sub) => (
                        <Link key={sub.name} href={sub.href || "#"}>
                          <div className={`flex items-center gap-3 py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${pathname === sub.href ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
                            <sub.icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{sub.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={item.href || "#"}>
                  <div className={`flex items-center p-3 rounded-2xl transition-all ${isCollapsed ? "justify-center" : "gap-3"} ${pathname === item.href ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-muted"}`}>
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-tight truncate">{item.name}</span>}
                  </div>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-primary/5">
            <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 rounded-2xl h-12" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? <Loader2 className="animate-spin w-5 h-5" /> : <LogOut className="w-5 h-5 shrink-0" />}
                {!isCollapsed && <span className="font-black uppercase text-[11px]">Keluar</span>}
            </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {/* --- HEADER RESPONSIVE --- */}
        <header className="h-20 border-b flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          
          {/* TAMPILAN MOBILE (md:hidden) */}
          <div className="flex items-center justify-between w-full md:hidden">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl bg-muted/50 w-9 h-9" 
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="font-black uppercase tracking-tighter text-[15px] leading-none whitespace-nowrap max-w-[65px] truncate  text-primary">
                WALI KELAS
              </h2>
            </div>
            <div className="flex items-center gap-2">
               {/* Unified Control Pill */}
               <div className="bg-muted/50 rounded-full flex items-center p-1 gap-0.5 border border-border/20 shadow-inner">
                  <ModeToggle />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:text-primary w-8 h-8" 
                    onClick={() => toast.info("Fitur Mode Anak segera hadir!")}
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
               {/* Avatar Bulat */}
               <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-black text-[10px] shrink-0  shadow-lg shadow-primary/20">
                  WK
               </div>
            </div>
          </div>

          {/* TAMPILAN DESKTOP (hidden md:flex) */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <h2 className="font-black uppercase tracking-tighter text-xl leading-none  whitespace-nowrap">
                PORTAL <span className="text-primary">WALI KELAS</span>
              </h2>
              <div className="flex items-center gap-1 border-l pl-4 border-border/50">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl hover:text-primary transition-all" 
                  onClick={() => toast.info("Fitur sedang dikembangkan")}
                >
                  <Baby className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl hover:text-primary transition-all" 
                  onClick={() => setIsPrivacyLocked(true)}
                >
                  <EyeOff className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l pl-4 border-border/50">
               <ModeToggle />
               <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 shrink-0 ">
                 WK
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