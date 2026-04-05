"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, Users, Database, Puzzle, Star, 
  Briefcase, ClipboardCheck, Printer, Settings, 
  LogOut, Flame, Menu, X, ChevronLeft, ChevronRight, 
  Bell, ChevronDown, Building2, CalendarDays, UserCheck, 
  UserCircle, School, BookOpen, Music, Layers, Map, 
  Image as ImageIcon, CalendarRange, Camera, ListTree, 
  PlayCircle, Users2, PenTool, Trophy, CalendarCheck, 
  BookOpenText, FileText, UserPlus, Baby, EyeOff, LockKeyhole,
  Loader2 // Ikon loading untuk unlock
} from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // --- STATE PRIVASI & SUBMENU ---
  const [isPrivacyLocked, setIsPrivacyLocked] = useState(false)
  const [privacyPass, setPrivacyPass] = useState("")
  const [lockError, setLockError] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  // Fungsi Toggle Submenu
  const toggleSubmenu = (name: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }))
  }

  // Auto-close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Otomatis buka submenu berdasarkan URL aktif
  useEffect(() => {
    const activeSubmenu = menu.find(item => 
      item.isSubmenu && item.submenus?.some(sub => pathname === sub.href)
    )
    if (activeSubmenu) {
      setOpenMenus(prev => ({ ...prev, [activeSubmenu.name]: true }))
    }
  }, [pathname])

  // Fungsi Unlock Xprivasi via Supabase Auth (Gunakan Password Akun Login)
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
        setLockError(false)
      } else {
        setLockError(true)
      }
    }
    setIsUnlocking(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/login")
      router.refresh()
    } catch (error: any) {
      console.error("Error logging out:", error.message)
      setIsLoggingOut(false)
    }
  }

  // Definisi Menu Lengkap dengan Submenu & Ikon
  const menu = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Master Pengguna", href: "/admin/pengguna", icon: UserPlus },
    { 
      name: "Master Referensi", 
      icon: Database,
      isSubmenu: true,
      submenus: [
        { name: "Data Sekolah", href: "/admin/referensi/sekolah", icon: Building2 },
        { name: "Data Tahun Ajaran", href: "/admin/referensi/tahun-ajaran", icon: CalendarDays },
        { name: "Data Guru", href: "/admin/referensi/guru", icon: UserCheck },
        { name: "Data Siswa", href: "/admin/referensi/siswa", icon: UserCircle },
        { name: "Data Kelas", href: "/admin/referensi/kelas", icon: School },
        { name: "Data Mata Pelajaran", href: "/admin/referensi/mapel", icon: BookOpen },
        { name: "Data Ekstrakurikuler", href: "/admin/referensi/ekskul", icon: Music },
        { name: "Data Kelompok Mapel", href: "/admin/referensi/kelompok-mapel", icon: Layers },
        { name: "Data Mapping Rapor", href: "/admin/referensi/mapping-rapor", icon: Map },
        { name: "Data Logo & TTD", href: "/admin/referensi/logo-ttd", icon: ImageIcon },
        { name: "Data Tanggal Rapor", href: "/admin/referensi/tanggal-rapor", icon: CalendarRange },
        { name: "Foto Siswa", href: "/admin/referensi/foto-siswa", icon: Camera },
      ]
    },
    { 
      name: "Master Ko-Kurikuler", 
      icon: Puzzle,
      isSubmenu: true,
      submenus: [
        { name: "Daftar Tema", href: "/admin/kokurikuler/tema", icon: ListTree },
        { name: "Kegiatan", href: "/admin/kokurikuler/kegiatan", icon: PlayCircle },
        { name: "Kelompok Ko-kurikuler", href: "/admin/kokurikuler/kelompok", icon: Users2 },
      ]
    },
    { name: "Master P5", href: "/admin/p5", icon: Star },
    { name: "Master PKL", href: "/admin/pkl", icon: Briefcase },
    { 
      name: "Master Penilaian", 
      icon: ClipboardCheck,
      isSubmenu: true,
      submenus: [
        { name: "Penilaian", href: "/admin/penilaian/input", icon: PenTool },
        { name: "Ekstrakurikuler", href: "/admin/penilaian/ekskul", icon: Trophy },
        { name: "Absensi Catatan", href: "/admin/penilaian/absensi", icon: CalendarCheck },
        { name: "Leger", href: "/admin/penilaian/leger", icon: BookOpenText },
      ]
    },
    { 
      name: "Master Cetak Rapor", 
      icon: Printer,
      isSubmenu: true,
      submenus: [
        { name: "Cetak Rapor", href: "/admin/cetak-rapor/rapor", icon: FileText },
      ]
    },
    { name: "Pengaturan", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-background font-sans transition-colors duration-1000 overflow-hidden text-foreground">
      
      {/* --- OVERLAY XPRIVASI (LOCK SCREEN) --- */}
      {isPrivacyLocked && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500">
          <div className="max-w-sm w-full p-8 text-center space-y-6">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-primary/20">
              <LockKeyhole className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Layar Terkunci</h2>
              <p className="text-sm text-muted-foreground mt-1">Masukkan kata sandi admin LENTERA untuk melanjutkan.</p>
            </div>
            <div className="space-y-3">
              <Input 
                type="password" 
                placeholder="Kata sandi..." 
                className={`text-center h-12 rounded-xl bg-muted/50 transition-all ${lockError ? 'border-red-500 animate-bounce' : ''}`}
                value={privacyPass}
                onChange={(e) => setPrivacyPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                disabled={isUnlocking}
              />
              {lockError && <p className="text-xs text-red-500 font-bold">Kata sandi salah!</p>}
              <Button onClick={handleUnlock} className="w-full h-12 rounded-xl font-bold shadow-lg" disabled={isUnlocking}>
                {isUnlocking ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Buka Kunci"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR MOBILE --- */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} 
        onClick={() => setIsMobileOpen(false)} 
      />
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-card border-r shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-xl"><Flame className="w-5 h-5 text-white" /></div>
              <span className="font-bold text-xl tracking-tight">LENTERA</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsMobileOpen(false)}><X className="w-6 h-6" /></Button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto pr-2 scrollbar-hide">
            {menu.map((item) => (
              <div key={item.name}>
                {item.isSubmenu ? (
                  <>
                    <button onClick={() => toggleSubmenu(item.name)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-all">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openMenus[item.name] ? "rotate-180" : ""}`} />
                    </button>
                    {openMenus[item.name] && (
                      <div className="mt-1 ml-4 space-y-1 border-l-2 border-muted pl-4 animate-in slide-in-from-top-2">
                        {item.submenus?.map((sub) => (
                          <Link key={sub.name} href={sub.href} onClick={() => setIsMobileOpen(false)}>
                            <div className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${pathname === sub.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                              <sub.icon className="w-3.5 h-3.5" />
                              {sub.name}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.href || "#"} onClick={() => setIsMobileOpen(false)}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground active:bg-muted"}`}>
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className={`hidden md:flex flex-col sticky top-0 h-screen border-r bg-card/30 backdrop-blur-md transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-10 bg-background border rounded-full p-1 hover:bg-muted transition-colors shadow-sm z-50">
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <div className={`p-6 flex items-center transition-all ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="bg-amber-500 p-2 rounded-xl shrink-0"><Flame className="w-5 h-5 text-white" /></div>
          {!isCollapsed && <span className="font-bold text-xl tracking-tight animate-in fade-in">LENTERA</span>}
        </div>
        <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto scrollbar-hide pb-10">
          {menu.map((item) => (
            <div key={item.name}>
              {item.isSubmenu ? (
                <>
                  <button onClick={() => toggleSubmenu(item.name)} className={`w-full flex items-center transition-all duration-200 rounded-xl px-4 py-3 ${isCollapsed ? "justify-center" : "justify-between"} ${pathname.includes(item.name.split(' ')[1]?.toLowerCase() || "") ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!isCollapsed && <span className="font-medium text-sm">{item.name}</span>}
                    </div>
                    {!isCollapsed && <ChevronDown className={`w-4 h-4 transition-transform ${openMenus[item.name] ? "rotate-180" : ""}`} />}
                  </button>
                  {!isCollapsed && openMenus[item.name] && (
                    <div className="mt-1 ml-9 space-y-1 animate-in slide-in-from-top-2 border-l border-muted/50 pl-3">
                      {item.submenus?.map((sub) => (
                        <Link key={sub.name} href={sub.href}>
                          <div className={`flex items-center gap-2 py-2 px-3 rounded-lg text-[11px] font-semibold transition-all ${pathname === sub.href ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                            <sub.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{sub.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={item.href || "#"}>
                  <div className={`flex items-center transition-all duration-200 group ${isCollapsed ? "justify-center h-12 w-12 mx-auto rounded-2xl" : "gap-3 px-4 py-3 rounded-xl"} ${pathname === item.href ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"}`}>
                    <item.icon className={`w-5 h-5 shrink-0 ${pathname !== item.href && "group-hover:scale-110 transition-transform"}`} />
                    {!isCollapsed && <span className="font-medium text-sm truncate">{item.name}</span>}
                  </div>
                </Link>
              )}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className={`w-full flex items-center text-red-500 hover:bg-red-50 rounded-xl h-11 ${isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-4"}`} onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className={`w-5 h-5 shrink-0 ${isLoggingOut ? "animate-pulse" : ""}`} />
            {!isCollapsed && <span className="text-sm font-semibold">{isLoggingOut ? "..." : "Keluar"}</span>}
          </Button>
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-8 sticky top-0 bg-background/80 backdrop-blur-md z-40 transition-all">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="md:hidden text-foreground shrink-0" onClick={() => setIsMobileOpen(true)}><Menu className="w-5 h-5" /></Button>
            <h2 className="font-bold text-foreground text-sm md:text-base truncate">{isCollapsed ? "Admin" : "Dashboard Admin"}</h2>
          </div>
          <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
            {/* --- CONTROL CENTER --- */}
            <div className="flex items-center bg-muted/50 p-1 rounded-2xl border border-border/50 gap-1 scale-90 md:scale-100">
               <ModeToggle />
               <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:text-amber-600" onClick={() => alert("Fitur ini segera hadir!")}><Baby className="w-5 h-5" /></Button>
               <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:text-primary" onClick={() => setIsPrivacyLocked(true)}><EyeOff className="w-5 h-5" /></Button>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-border/50 ml-1">
                <div className="text-right hidden sm:block leading-none"><p className="text-[10px] font-bold uppercase text-amber-600 mb-0.5">Admin</p></div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-amber-500/10 shrink-0">AD</div>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/30 dark:bg-transparent">
          <div className="max-w-full mx-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}