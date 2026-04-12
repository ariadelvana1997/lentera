"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Trophy, Plus, Search, Loader2, Edit3, 
  Trash2, UserCheck, LayoutGrid, X, Check, Info, ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"

export default function WalikelasReferensiEkskulPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [ekskulList, setEkskulList] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedEkskul, setSelectedEkskul] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [formData, setFormData] = useState({
    nama_ekskul: "",
    pembina_id: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetching(true)
    try {
      // 1. Ambil Semua Data Ekskul + Join Pembina (Tanpa Filter Guru Logged In)
      const { data: ekskul } = await supabase
        .from('ekskul')
        .select(`
          *,
          pembina:profiles!pembina_id(nama_lengkap)
        `)
        .order('nama_ekskul', { ascending: true })

      // 2. Ambil Data Guru untuk Dropdown Pembina
      const { data: guru } = await supabase
        .from('profiles')
        .select('id, nama_lengkap')
        .contains('roles', ['Guru'])

      if (ekskul) setEkskulList(ekskul)
      if (guru) setTeachers(guru)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('ekskul')
          .update(formData)
          .eq('id', selectedEkskul.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ekskul')
          .insert([formData])
        if (error) throw error
      }
      
      toast.success("✅ Data Ekskul Berhasil Disimpan!")
      setIsDialogOpen(false)
      fetchData()
    } catch (err: any) { 
      toast.error("Gagal menyimpan: " + err.message) 
    } finally { 
      setLoading(false) 
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus ekstrakurikuler ini?")) {
      try {
        const { error } = await supabase.from('ekskul').delete().eq('id', id)
        if (error) throw error
        toast.success("Ekskul berhasil dihapus")
        fetchData()
      } catch (err: any) {
        toast.error("Gagal menghapus: " + err.message)
      }
    }
  }

  const handleEditClick = (ekskul: any) => {
    setIsEditMode(true)
    setSelectedEkskul(ekskul)
    setFormData({
      nama_ekskul: ekskul.nama_ekskul,
      pembina_id: ekskul.pembina_id ?? ""
    })
    setIsDialogOpen(true)
  }

  const handleOpenAdd = () => {
    setIsEditMode(false)
    setFormData({ nama_ekskul: "", pembina_id: "" })
    setIsDialogOpen(true)
  }

  // Filter pencarian
  const filteredEkskul = ekskulList.filter(item => 
    item.nama_ekskul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.pembina?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 ">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 uppercase">
            <Trophy className="w-8 h-8 text-primary" /> Master Ekskul
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest mt-1">
            Konfigurasi Kegiatan Ekstrakurikuler Sekolah
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="rounded-2xl font-black shadow-lg shadow-primary/20 h-12 px-6 hover:scale-[1.02] transition-all uppercase tracking-tight">
          <Plus className="w-5 h-5 mr-2" /> Tambah Ekskul Baru
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[3rem] overflow-hidden">
        {/* SEARCH BAR */}
        <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Nama Ekskul atau Pembina..." 
              className="pl-12 rounded-2xl h-12 bg-muted/30 border-none font-bold text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
             <ShieldCheck className="w-4 h-4 text-primary" />
             <span className="text-[10px] font-black uppercase text-primary">Akses Penuh Wali Kelas</span>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-20 p-8 text-center font-black text-[10px] uppercase text-muted-foreground">No</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-primary pl-0">Nama Ekstrakurikuler</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-muted-foreground">Pembina Utama (Guru)</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-8 text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={4} className="h-60 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground opacity-20" /></TableCell></TableRow>
            ) : filteredEkskul.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="p-20 text-center text-muted-foreground font-bold uppercase text-xs  opacity-50">Data ekskul tidak ditemukan.</TableCell></TableRow>
            ) : filteredEkskul.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-muted/5 transition-all border-border/50 group">
                <TableCell className="text-center font-black text-muted-foreground/40 p-6">{index + 1}</TableCell>
                <TableCell className="pl-0">
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase text-primary leading-none mb-1 group-hover:tracking-wider transition-all">{item.nama_ekskul}</span>
                    <span className="text-[9px] font-bold text-muted-foreground tracking-tighter uppercase">ID-ACT: {item.id.split('-')[0]}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase leading-none mb-1">{item.pembina?.nama_lengkap || "Belum Ditentukan"}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Status: Pembina Aktif</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right p-8">
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => handleEditClick(item)} variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-primary/20 text-primary hover:bg-primary hover:text-white shadow-sm transition-all">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleDelete(item.id)} variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-red-200 text-red-500 hover:bg-red-500 hover:text-white shadow-sm transition-all">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-8 border-t border-border/50 text-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.5em] opacity-40">LENTERA • Extracurricular Control Center</p>
        </div>
      </Card>

      {/* DIALOG TAMBAH/EDIT (Sultan Look) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-10 border-none shadow-2xl bg-background/95 backdrop-blur-xl ">
          <form onSubmit={handleSubmit} className="space-y-8">
            <DialogHeader>
              <div className="bg-primary/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4">
                 <Trophy className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter  leading-none">
                {isEditMode ? "Ubah Ekskul" : "Daftar Ekskul"}
              </DialogTitle>
              <DialogDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                Konfigurasi unit kegiatan siswa Multiverse LENTERA.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid gap-3">
                <Label className="text-[10px] uppercase font-black ml-1 text-primary tracking-widest">Identitas Ekstrakurikuler</Label>
                <Input 
                  placeholder="Contoh: English Club, Robotik..." 
                  value={formData.nama_ekskul}
                  onChange={e => setFormData({...formData, nama_ekskul: e.target.value})}
                  className="rounded-2xl border-none bg-muted/40 h-14 font-black  text-lg shadow-inner focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label className="text-[10px] uppercase font-black ml-1 text-primary tracking-widest">Penanggung Jawab (Pembina)</Label>
                <Select 
                  value={formData.pembina_id} 
                  onValueChange={v => setFormData({...formData, pembina_id: v})}
                >
                  <SelectTrigger className="rounded-2xl border-none bg-muted/40 h-14 font-bold  shadow-inner">
                    <SelectValue placeholder="-- Pilih Guru Pembina --" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id} className="font-bold  uppercase text-xs py-3">{t.nama_lengkap}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-start gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                   <Info className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                   <p className="text-[9px] font-bold text-amber-700 leading-tight">Pastikan guru yang dipilih bersedia menjadi pembina kegiatan tersebut.</p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-dashed">
              <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                   <span className="flex items-center gap-2"><Check className="w-5 h-5" /> SIMPAN KONFIGURASI</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}