"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Briefcase, Plus, Search, Loader2, Edit3, 
  Trash2, UserCheck, Star, MoreHorizontal, 
  CheckCircle2, Layout, Target, Trash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select"

// --- DATA MASTER STRUKTUR P5 ---
const P5_STRUCTURE: Record<string, string[]> = {
  "Beriman, bertakwa kepada Tuhan YME, dan berakhlak mulia": [
    "Hubungan dengan Tuhan Yang Maha Esa",
    "Hubungan dengan sesama manusia",
    "Hubungan dengan Lingkungan Alam"
  ],
  "Berkebinekaan global": ["Kewargaan Lokal", "Kewargaan Nasional", "Kewargaan Global"],
  "Bernalar kritis": ["Penyampaian Argumentasi", "Pengambilan Keputusan", "Penyelesaian Masalah"],
  "Kreatif": ["Gagasan baru", "Fleksibilitas berpikir", "Karya"],
  "Mandiri": ["Bertanggung Jawab", "Kepemimpinan", "Pengembangan Diri"],
  "Gotong royong": ["Berbagi", "Kerja sama"],
  "Komunikasi": ["Menyimak", "Berbicara", "Membaca", "Menulis"],
  "Kesehatan": [
    "Hidup bersih dan sehat", 
    "Kebugaran, kesehatan fisik, dan kesehatan mental", 
    "Prinsip keselamatan dan kesehatan kerja (K3) di dunia kerja"
  ]
}

export default function KegiatanKokurikulerPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [activities, setActivities] = useState<any[]>([])
  const [themes, setThemes] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)

  const [formData, setFormData] = useState({
    judul_kegiatan: "",
    tema_id: "",
    deskripsi_kegiatan: ""
  })

  // --- STATE UNTUK PROFIL LULUSAN (BARU) ---
  const [profileList, setProfileList] = useState<any[]>([])
  const [newCapaian, setNewCapaian] = useState({ dimensi: "", sub_dimensi: "" })

  useEffect(() => {
    fetchThemes()
    fetchActivities()
  }, [])

  const fetchThemes = async () => {
    const { data } = await supabase.from('tema_kokurikuler').select('*').eq('is_active', true)
    if (data) setThemes(data)
  }

  const fetchActivities = async () => {
    setFetching(true)
    try {
      const { data } = await supabase
        .from('kegiatan_kokurikuler')
        .select(`
          *,
          tema:tema_kokurikuler(tema),
          profil_count:kegiatan_profil(count)
        `)
        .ilike('judul_kegiatan', `%${searchQuery}%`)
      if (data) setActivities(data)
    } finally { setFetching(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditMode) {
        await supabase.from('kegiatan_kokurikuler').update(formData).eq('id', selectedActivity.id)
      } else {
        await supabase.from('kegiatan_kokurikuler').insert([formData])
      }
      setIsDialogOpen(false)
      fetchActivities()
    } finally { setLoading(false) }
  }

  // --- LOGIKA MANAJEMEN PROFIL LULUSAN (UPDATE) ---
  const handleOpenProfile = async (activity: any) => {
    setSelectedActivity(activity)
    setIsProfileOpen(true)
    fetchProfileList(activity.id)
  }

  const fetchProfileList = async (id: string) => {
    const { data } = await supabase.from('kegiatan_profil').select('*').eq('kegiatan_id', id)
    if (data) setProfileList(data)
  }

 const handleAddCapaian = async () => {
    if (!newCapaian.dimensi || !newCapaian.sub_dimensi) return alert("Pilih Dimensi & Sub-dimensi!")
    setLoading(true)
    try {
      const { error } = await supabase.from('kegiatan_profil').insert([{
        kegiatan_id: selectedActivity.id,
        dimensi: newCapaian.dimensi,
        sub_dimensi: newCapaian.sub_dimensi
      }])

      // JIKA ERROR DARI SUPABASE
      if (error) {
        console.error("Supabase Error Detail:", error)
        throw new Error(error.message)
      }

      setNewCapaian({ dimensi: "", sub_dimensi: "" })
      fetchProfileList(selectedActivity.id)
      fetchActivities()
    } catch (err: any) {
      // SEKARANG ERROR AKAN TERBACA JELAS
      alert("❌ Gagal simpan: " + (err.message || "Terjadi kesalahan pada database"));
    } finally { 
      setLoading(false) 
    }
  }

  const handleDeleteCapaian = async (id: string) => {
    await supabase.from('kegiatan_profil').delete().eq('id', id)
    fetchProfileList(selectedActivity.id)
    fetchActivities()
  }

  const handleDeleteActivity = async (id: string) => {
    if (confirm("Hapus kegiatan ini? Semua data profil lulusan di dalamnya akan hilang.")) {
        await supabase.from('kegiatan_kokurikuler').delete().eq('id', id)
        fetchActivities()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Layout className="w-8 h-8 text-primary" /> Kegiatan Projek
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">Daftar Kegiatan Kokurikuler (P5)</p>
        </div>
        <Button onClick={() => { setIsEditMode(false); setFormData({judul_kegiatan:"", tema_id:"", deskripsi_kegiatan:""}); setIsDialogOpen(true); }} className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
          <Plus className="w-4 h-4 mr-2" /> Tambah Kegiatan
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Kegiatan..." 
              className="pl-12 rounded-2xl h-11 bg-muted/30 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-16 p-6 text-center font-black text-[10px] uppercase">No</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-primary">Judul Kegiatan</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">Opsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={3} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : activities.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-muted/5 transition-colors border-border/50">
                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="py-4">
                  <div className="font-black text-sm uppercase">{item.judul_kegiatan}</div>
                  <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-amber-500" /> {item.tema?.tema}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    <Button onClick={() => { setIsEditMode(true); setSelectedActivity(item); setFormData({judul_kegiatan: item.judul_kegiatan, tema_id: item.tema_id, deskripsi_kegiatan: item.deskripsi_kegiatan}); setIsDialogOpen(true); }} variant="ghost" size="icon" className="rounded-xl text-primary" title="Edit Kegiatan">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleOpenProfile(item)} variant="ghost" size="icon" className="rounded-xl text-amber-600 relative" title="Profil Lulusan">
                      <UserCheck className="w-4 h-4" />
                      {item.profil_count?.[0]?.count > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-background" />}
                    </Button>
                    <Button onClick={() => handleDeleteActivity(item.id)} variant="ghost" size="icon" className="rounded-xl text-red-500" title="Hapus Kegiatan">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* DIALOG TAMBAH/EDIT KEGIATAN */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8 border-none shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{isEditMode ? "Edit Kegiatan" : "Tambah Kegiatan"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Tema Projek</Label>
                <Select value={formData.tema_id} onValueChange={v => setFormData({...formData, tema_id: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue placeholder="Pilih Tema" /></SelectTrigger>
                  <SelectContent>{themes.map(t => <SelectItem key={t.id} value={t.id}>{t.tema}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Judul Kegiatan</Label>
                <Input value={formData.judul_kegiatan} onChange={e => setFormData({...formData, judul_kegiatan: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11" required />
              </div>
            </div>
            <DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg" disabled={loading}>SIMPAN KEGIATAN</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG PROFIL LULUSAN (UPDATE: TABEL & CAPAIAN) */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black">Manajemen Capaian Projek</DialogTitle>
            <DialogDescription>Kegiatan: <span className="text-primary font-bold uppercase">{selectedActivity?.judul_kegiatan}</span></DialogDescription>
          </DialogHeader>

          {/* FORM TAMBAH CAPAIAN */}
          <div className="px-8 pb-6 border-b border-dashed grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/5 pt-2">
            <div className="space-y-1">
               <Label className="text-[9px] uppercase font-black ml-1">Pilih Dimensi</Label>
               <Select value={newCapaian.dimensi} onValueChange={(v) => setNewCapaian({dimensi: v, sub_dimensi: ""})}>
                 <SelectTrigger className="rounded-xl border-none bg-white h-10 text-xs font-bold shadow-sm"><SelectValue placeholder="Pilih Dimensi"/></SelectTrigger>
                 <SelectContent>
                   {Object.keys(P5_STRUCTURE).map(d => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
            <div className="space-y-1 flex gap-2 items-end">
               <div className="flex-1">
                 <Label className="text-[9px] uppercase font-black ml-1">Pilih Sub-Dimensi</Label>
                 <Select 
                    value={newCapaian.sub_dimensi} 
                    onValueChange={(v) => setNewCapaian({...newCapaian, sub_dimensi: v})}
                    disabled={!newCapaian.dimensi}
                 >
                   <SelectTrigger className="rounded-xl border-none bg-white h-10 text-xs font-bold shadow-sm"><SelectValue placeholder="Pilih Sub-Dimensi"/></SelectTrigger>
                   <SelectContent>
                     {newCapaian.dimensi && P5_STRUCTURE[newCapaian.dimensi].map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                   </SelectContent>
                 </Select>
               </div>
               <Button onClick={handleAddCapaian} disabled={loading} className="rounded-xl h-10 shadow-lg px-4">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} TAMBAH
               </Button>
            </div>
          </div>

          {/* TABEL LIST CAPAIAN */}
         {/* TABEL CAPAIAN - GANTI BAGIAN INI */}
<ScrollArea className="flex-1 px-8 py-4">
  <Table>
    <TableHeader>
      <TableRow className="border-none bg-muted/30">
        <TableHead className="w-12 font-black text-[10px] uppercase">No</TableHead>
        {/* Tambahkan w-[250px] atau w-[300px] di sini agar tidak nabrak */}
        <TableHead className="w-[280px] font-black text-[10px] uppercase">Dimensi</TableHead>
        <TableHead className="font-black text-[10px] uppercase">Sub-Dimensi</TableHead>
        <TableHead className="w-12 text-right font-black text-[10px] uppercase">Opsi</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {profileList.length === 0 ? (
        <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic text-xs">Belum ada capaian profil.</TableCell></TableRow>
      ) : profileList.map((p, i) => (
        <TableRow key={p.id} className="border-border/50">
          <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
          {/* Gunakan break-words agar teks panjang turun ke bawah */}
          <TableCell className="text-[11px] font-black uppercase text-primary leading-tight py-4 pr-6 break-words">
            {p.dimensi}
          </TableCell>
          <TableCell className="text-[11px] font-bold leading-tight py-4 break-words">
            {p.sub_dimensi}
          </TableCell>
          <TableCell className="text-right">
            <Button onClick={() => handleDeleteCapaian(p.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-lg hover:bg-red-50">
              <Trash2 className="w-4 h-4"/>
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ScrollArea>

          <div className="p-6 bg-muted/20 border-t text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
            <Target className="w-3 h-3 text-primary" /> Terdeteksi {profileList.length} Capaian P5 Terpilih
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}