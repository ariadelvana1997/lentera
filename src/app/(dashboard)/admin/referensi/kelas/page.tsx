"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  LayoutGrid, Plus, Search, Loader2, Edit3, 
  Trash2, Users, UserPlus, X, Check, SearchCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"

export default function ReferensiKelasPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [classList, setClassList] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
  const [isMappingOpen, setIsMappingOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)

  const [formData, setFormData] = useState({
    kurikulum: "Merdeka",
    nama_kelas: "",
    tingkat: "",
    wali_id: ""
  })

  const [mappingSelection, setMappingSelection] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetching(true)
    try {
      const { data: kelas } = await supabase
        .from('kelas')
        .select(`
          *,
          wali:profiles!wali_id(nama_lengkap),
          siswa_count:profiles!kelas_id(count)
        `)
        .order('tingkat', { ascending: true })

      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, nama_lengkap, roles, kelas_id')

      const guruList = allProfiles?.filter((p: any) => {
        const r = Array.isArray(p.roles) ? p.roles.join(' ') : String(p.roles);
        return r.toLowerCase().includes('guru');
      }) || [];

      const siswaList = allProfiles?.filter((p: any) => {
        const r = Array.isArray(p.roles) ? p.roles.join(' ') : String(p.roles);
        return r.toLowerCase().includes('siswa');
      }) || [];

      if (kelas) setClassList(kelas)
      if (guruList) setTeachers(guruList)
      setAvailableStudents(siswaList)
    } catch (err: any) {
      toast.error("Gagal load data: " + err.message)
    } finally {
      setFetching(false)
    }
  }

  const handleOpenMapping = (kelas: any) => {
    setSelectedClass(kelas)
    const currentMembers = availableStudents
      .filter(s => s.kelas_id === kelas.id)
      .map(s => s.id)
    setMappingSelection(currentMembers)
    setSearchTerm("") 
    setIsMappingOpen(true)
  }

  const handleSaveMapping = async () => {
    setLoading(true)
    try {
      await supabase.from('profiles').update({ kelas_id: null }).eq('kelas_id', selectedClass.id)
      if (mappingSelection.length > 0) {
        const { error } = await supabase.from('profiles').update({ kelas_id: selectedClass.id }).in('id', mappingSelection)
        if (error) throw error
      }
      toast.success(`Berhasil memetakan ${mappingSelection.length} siswa!`)
      setIsMappingOpen(false)
      fetchData()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditMode) {
        await supabase.from('kelas').update(formData).eq('id', selectedClass.id)
      } else {
        await supabase.from('kelas').insert([formData])
      }
      setIsClassDialogOpen(false)
      fetchData()
      toast.success("Data kelas disimpan!")
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  // --- LOGIC FILTER: Siswa kelas lain "HILANG" ---
  const filteredStudents = availableStudents.filter(s => {
    const matchesSearch = s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase());
    // Tampil HANYA JIKA belum punya kelas ATAU siswa ini memang anggota kelas yang sedang dibuka
    const isAvailableOrInThisClass = s.kelas_id === null || s.kelas_id === selectedClass?.id;
    return matchesSearch && isAvailableOrInThisClass;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 ">
            <LayoutGrid className="w-8 h-8 text-primary" /> Referensi Kelas
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest leading-none mt-1">Kelola Rombongan Belajar & Wali Kelas</p>
        </div>
        <Button onClick={() => { setIsEditMode(false); setFormData({kurikulum: "Merdeka", nama_kelas:"", tingkat:"", wali_id:""}); setIsClassDialogOpen(true); }} className="rounded-xl font-black shadow-lg h-11 px-6">
          <Plus className="w-4 h-4 mr-2" /> TAMBAH KELAS
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-6 text-center font-black text-[10px] uppercase text-muted-foreground">No</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-muted-foreground">Kurikulum</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-primary">Nama Kelas</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-muted-foreground">Wali Kelas</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center text-muted-foreground">Siswa</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-6 text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : classList.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-muted/5 border-border/50 transition-colors">
                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-md text-[8px] font-black uppercase px-2 py-0 border-primary/30 text-primary bg-primary/5">{item.kurikulum}</Badge>
                </TableCell>
                <TableCell className="font-black text-sm uppercase">{item.nama_kelas} <span className="text-[10px] opacity-40 ml-1">({item.tingkat})</span></TableCell>
                <TableCell className="text-[11px] font-bold uppercase text-muted-foreground ">
                  {item.wali?.nama_lengkap || <span className="text-red-400">Belum diatur</span>}
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" onClick={() => handleOpenMapping(item)} className="h-9 gap-2 rounded-xl text-primary font-black text-[11px] uppercase hover:bg-primary/10">
                    <Users className="w-4 h-4" /> {item.siswa_count?.[0]?.count || 0} Siswa
                  </Button>
                </TableCell>
                <TableCell className="text-right p-6">
                  <div className="flex justify-end gap-1">
                    <Button onClick={() => { setIsEditMode(true); setSelectedClass(item); setFormData({kurikulum: item.kurikulum, nama_kelas: item.nama_kelas, tingkat: item.tingkat, wali_id: item.wali_id || ""}); setIsClassDialogOpen(true); }} variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/5"><Edit3 className="w-4 h-4"/></Button>
                    <Button onClick={() => { if(confirm("Hapus kelas ini?")) supabase.from('kelas').delete().eq('id', item.id).then(fetchData) }} variant="ghost" size="icon" className="rounded-xl text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* DIALOG TAMBAH/EDIT KELAS */}
      <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none shadow-2xl">
          <form onSubmit={handleSubmitClass} className="space-y-6">
            <DialogHeader><DialogTitle className="text-2xl font-black">{isEditMode ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1 text-muted-foreground">Nama Kelas</Label>
                <Input value={formData.nama_kelas} onChange={e => setFormData({...formData, nama_kelas: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 px-4 font-bold uppercase" required/>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1 text-muted-foreground">Pilih Wali Kelas</Label>
                <Select value={formData.wali_id} onValueChange={v => setFormData({...formData, wali_id: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11 px-4"><SelectValue placeholder="Klik untuk memilih Guru..."/></SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.nama_lengkap}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20" disabled={loading}>SIMPAN DATA</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG MAPPING SISWA (VERSI ANTI-LENGKET & AUTO-FILTER) */}
      <Dialog open={isMappingOpen} onOpenChange={setIsMappingOpen}>
        <DialogContent className="sm:max-w-[500px] h-[90vh] max-h-[700px] rounded-[2.5rem] p-0 border-none shadow-2xl flex flex-col bg-white overflow-hidden">
          
          {/* 1. HEADER (STIKY - TIDAK IKUT SCROLL) */}
          <div className="p-8 pb-6 bg-primary/5 shrink-0 border-b border-primary/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight  flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" /> Anggota {selectedClass?.nama_kelas}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                Siswa kelas lain otomatis disembunyikan.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Cari nama siswa..." 
                className="pl-12 rounded-2xl border-none bg-white shadow-sm h-12 text-xs font-black uppercase " 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          {/* 2. AREA DAFTAR (SCROLLABLE AREA) */}
          {/* overflow-y-auto adalah kunci agar bagian ini saja yang bisa digulung */}
          <div className="flex-1 overflow-y-auto bg-white/50">
            <div className="p-8 space-y-3">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-20 opacity-20">
                  <SearchCheck className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase ">Tidak ada siswa tersedia.</p>
                </div>
              ) : filteredStudents.map((siswa) => (
                <label 
                  key={siswa.id} 
                  className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all cursor-pointer group ${
                    mappingSelection.includes(siswa.id) 
                      ? "bg-primary/5 border-primary shadow-sm" 
                      : "border-transparent hover:bg-muted/40"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase group-hover:text-primary transition-colors">
                      {siswa.nama_lengkap}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">
                      {siswa.id && mappingSelection.includes(siswa.id) ? 'Anggota Aktif' : 'Tersedia'}
                    </span>
                  </div>
                  <Checkbox 
                    checked={mappingSelection.includes(siswa.id)} 
                    onCheckedChange={() => setMappingSelection(prev => 
                      prev.includes(siswa.id) ? prev.filter(i => i !== siswa.id) : [...prev, siswa.id]
                    )} 
                    className="w-6 h-6 rounded-lg border-muted-foreground/30" 
                  />
                </label>
              ))}
            </div>
          </div>

          {/* 3. FOOTER (STIKY - TIDAK IKUT SCROLL) */}
          <div className="p-8 bg-muted/20 shrink-0 border-t border-border/50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-center mb-5 px-2">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase text-muted-foreground  leading-none mb-1">Total Terpilih</span>
                 <span className="text-xl font-black text-primary tracking-tighter leading-none">{mappingSelection.length} Siswa</span>
              </div>
              <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black px-5 py-1 bg-white shadow-sm text-[10px] ">
                {filteredStudents.length} Tersedia
              </Badge>
            </div>
            <Button 
              onClick={handleSaveMapping} 
              className="w-full h-14 rounded-2xl font-black shadow-xl shadow-primary/20 uppercase tracking-widest text-xs " 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />} 
              TERAPKAN ANGGOTA KELAS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}