"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Settings, User, Lock, Palette, Globe, 
  Bell, Save, Loader2, Camera, ShieldCheck,
  Type, Check, Laptop, Moon, Sun
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export default function GuruSettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { theme, setTheme } = useTheme()
  
  const [profile, setProfile] = useState({
    id: "",
    nama_lengkap: "",
    email: "",
    nuptk: "",
    no_hp: "",
    foto_url: ""
  })

  const [password, setPassword] = useState({ old: "", new: "", confirm: "" })
  const [selectedFont, setSelectedFont] = useState("font-jakarta-sans")

  useEffect(() => {
    setMounted(true)
    fetchProfile()
    const savedFont = localStorage.getItem('app_font') || 'font-jakarta-sans'
    setSelectedFont(savedFont)
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('data_guru')
          .select('*')
          .eq('email', user.email)
          .single()
        
        if (data) {
          setProfile({
            id: data.id,
            nama_lengkap: data.nama_lengkap,
            email: user.email || "",
            nuptk: data.nuptk || "-",
            no_hp: data.no_hp || "",
            foto_url: data.foto_url || ""
          })
        }
      }
    } finally { setLoading(false) }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('data_guru')
        .update({
          nama_lengkap: profile.nama_lengkap,
          no_hp: profile.no_hp
        })
        .eq('id', profile.id)

      if (error) throw error
      toast.success("Profil berhasil diperbarui!")
    } catch (err: any) {
      toast.error("Gagal update profil: " + err.message)
    } finally { setSaving(false) }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.new !== password.confirm) return toast.error("Konfirmasi password tidak cocok!")
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: password.new })
      if (error) throw error
      toast.success("Password berhasil diganti!")
      setPassword({ old: "", new: "", confirm: "" })
    } catch (err: any) {
      toast.error("Gagal ganti password: " + err.message)
    } finally { setSaving(false) }
  }

  const changeAppFont = (fontClass: string) => {
    setSelectedFont(fontClass)
    localStorage.setItem('app_font', fontClass)
    // Hapus semua class font lama
    const html = document.documentElement
    const fontClasses = Array.from(html.classList).filter(c => c.startsWith('font-'))
    html.classList.remove(...fontClasses)
    // Tambah yang baru
    html.classList.add(fontClass)
    // Update CSS Variable untuk dynamic font
    html.style.setProperty('--font-app-dynamic', `var(--${fontClass})`)
    toast.success(`Font diganti ke ${fontClass.replace('font-', '').replace(/-/g, ' ')}`)
  }

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase flex items-center gap-3">
            <Settings className="w-8 h-8 md:w-10 md:h-10 text-primary" /> Pengaturan <span className="text-primary text-shadow-glow">Akun</span>
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest mt-1">Kelola informasi profil dan preferensi sistem LENTERA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PROFILE CARD */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-md rounded-[3rem] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />
            <CardContent className="p-8 relative z-10 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="w-full h-full rounded-[2.5rem] bg-muted flex items-center justify-center border-4 border-background shadow-xl overflow-hidden">
                  {profile.foto_url ? (
                    <img src={profile.foto_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <button className="absolute -right-2 -bottom-2 p-3 bg-primary text-white rounded-2xl shadow-lg hover:scale-110 transition-all">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight leading-none">{profile.nama_lengkap || "Nama Guru"}</h2>
              <p className="text-[10px] font-black text-primary uppercase mt-2 tracking-widest">{profile.nuptk}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                 <Badge variant="outline" className="rounded-full bg-background/50 border-primary/20 text-[9px] font-black px-3 ">TENAGA PENDIDIK</Badge>
                 <Badge className="rounded-full bg-green-500/10 text-green-600 border-none text-[9px] font-black px-3 ">AKUN AKTIF</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5 rounded-[2.5rem] p-6 ">
             <div className="flex items-center gap-3 text-primary mb-4 font-black uppercase text-xs tracking-tighter">
                <ShieldCheck size={16} /> Keamanan Data
             </div>
             <p className="text-[11px] font-medium leading-relaxed opacity-60">
                Data Anda dilindungi oleh enkripsi tingkat tinggi di ekosistem LENTERA Multiverse. Pastikan tidak membagikan kredensial login kepada siapapun.
             </p>
          </Card>
        </div>

        {/* SETTINGS TABS */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profil" className="w-full">
            <TabsList className="bg-muted/30 p-1 rounded-2xl h-14 w-full justify-start mb-6 border border-border/50">
              <TabsTrigger value="profil" className="rounded-xl font-black uppercase text-[10px] px-6 data-[state=active]:bg-background data-[state=active]:shadow-md">Profil</TabsTrigger>
              <TabsTrigger value="keamanan" className="rounded-xl font-black uppercase text-[10px] px-6 data-[state=active]:bg-background data-[state=active]:shadow-md">Keamanan</TabsTrigger>
              <TabsTrigger value="tampilan" className="rounded-xl font-black uppercase text-[10px] px-6 data-[state=active]:bg-background data-[state=active]:shadow-md">Multiverse</TabsTrigger>
            </TabsList>

            {/* TAB PROFIL */}
            <TabsContent value="profil" className="space-y-4">
              <Card className="border-none shadow-xl bg-card/40 backdrop-blur-md rounded-[3rem] p-8">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black ml-1">Nama Lengkap</Label>
                      <Input value={profile.nama_lengkap} onChange={e => setProfile({...profile, nama_lengkap: e.target.value})} className="h-12 rounded-xl bg-muted/30 border-none font-bold " />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black ml-1">Email (Read Only)</Label>
                      <Input value={profile.email} readOnly className="h-12 rounded-xl bg-muted/10 border-none font-bold opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black ml-1">NUPTK / ID Pegawai</Label>
                      <Input value={profile.nuptk} readOnly className="h-12 rounded-xl bg-muted/10 border-none font-bold opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black ml-1">Nomor WhatsApp</Label>
                      <Input value={profile.no_hp} onChange={e => setProfile({...profile, no_hp: e.target.value})} className="h-12 rounded-xl bg-muted/30 border-none font-bold " />
                    </div>
                  </div>
                  <Button type="submit" disabled={saving} className="w-full md:w-fit px-10 h-12 rounded-2xl font-black shadow-lg shadow-primary/20">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />} SIMPAN PERUBAHAN
                  </Button>
                </form>
              </Card>
            </TabsContent>

            {/* TAB KEAMANAN */}
            <TabsContent value="keamanan" className="space-y-4">
              <Card className="border-none shadow-xl bg-card/40 backdrop-blur-md rounded-[3rem] p-8">
                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black ml-1">Password Baru</Label>
                    <Input type="password" value={password.new} onChange={e => setPassword({...password, new: e.target.value})} className="h-12 rounded-xl bg-muted/30 border-none font-bold" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black ml-1">Konfirmasi Password Baru</Label>
                    <Input type="password" value={password.confirm} onChange={e => setPassword({...password, confirm: e.target.value})} className="h-12 rounded-xl bg-muted/30 border-none font-bold" placeholder="••••••••" />
                  </div>
                  <Button type="submit" disabled={saving} variant="destructive" className="w-full rounded-2xl font-black h-12 shadow-lg">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Lock className="mr-2 w-4 h-4" />} GANTI PASSWORD
                  </Button>
                </form>
              </Card>
            </TabsContent>

            {/* TAB TAMPILAN (FONT MULTIVERSE) */}
            <TabsContent value="tampilan" className="space-y-4">
              <Card className="border-none shadow-xl bg-card/40 backdrop-blur-md rounded-[3rem] p-8">
                <div className="space-y-8">
                  <div>
                    <Label className="text-[10px] uppercase font-black mb-4 block tracking-widest text-primary  flex items-center gap-2">
                      <Palette size={14} /> Tema Aplikasi
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                       {[
                         { id: 'light', icon: Sun, label: 'Light' },
                         { id: 'dark', icon: Moon, label: 'Dark' },
                         { id: 'system', icon: Laptop, label: 'System' }
                       ].map((t) => (
                         <button 
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${theme === t.id ? 'bg-primary/10 border-primary text-primary shadow-inner' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`}
                         >
                            <t.icon size={20} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{t.label}</span>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] uppercase font-black mb-4 block tracking-widest text-primary  flex items-center gap-2">
                      <Type size={14} /> Font Multiverse (30+ Pilihan)
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-64 overflow-y-auto pr-2 scrollbar-hide">
                       {[
                         'font-jakarta-sans', 'font-inter', 'font-poppins', 'font-montserrat', 
                         'font-roboto', 'font-opensans', 'font-lato', 'font-oswald', 
                         'font-raleway', 'font-nunito', 'font-ubuntu', 'font-bebasneue',
                         'font-sourcesans', 'font-josefinsans', 'font-anton', 'font-pacifico'
                       ].map((f) => (
                         <button 
                            key={f}
                            onClick={() => changeAppFont(f)}
                            className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between ${selectedFont === f ? 'bg-primary border-primary text-white shadow-lg' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`}
                         >
                            <span className={`${f} text-xs font-medium`}>{f.replace('font-', '').replace(/-/g, ' ').toUpperCase()}</span>
                            {selectedFont === f && <Check size={14} className="animate-in zoom-in" />}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="text-center opacity-30 pt-10">
        <p className="text-[9px] font-black uppercase tracking-[0.6em]">Powered by LENTERA APP DELVANA & Ceu AI</p>
      </div>
    </div>
  )
}