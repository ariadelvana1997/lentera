"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { registerUserAction } from "@/app/actions/register-user"
import { 
  BookOpen, Plus, Search, Loader2, Edit3, 
  Trash2, UserCheck, LayoutGrid, Target,
  ChevronLeft, ChevronRight, Trash, X
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

// --- INITIAL STATE ---
const initialFormState = {
  nama_mapel: "",
  kelas_ids: [] as string[],
  guru_id: "",
  kktp: "75",
  tingkat: ""
}

export default function ReferensiMapelPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // --- STATE SELECTION & PAGINATION ---
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // --- STATE TP ---
  const [isTPDialogOpen, setIsTPDialogOpen] = useState(false)
  const [selectedPengampu, setSelectedPengampu] = useState<any>(null)
  const [tpList, setTpList] = useState<any[]>([])
  const [tpFormData, setTpFormData] = useState({ kode_tp: "", deskripsi_tp: "" })

  const [formData, setFormData] = useState<any>(initialFormState)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetching(true)
    try {
      const { data: mapel } = await supabase
        .from('mata_pelajaran')
        .select(`
          *,
          mapel_pengampu (
            id, kktp, tingkat, guru_id, kelas_id,
            kelas:kelas(nama_kelas),
            guru:profiles!guru_id(nama_lengkap),
            tp_count:tujuan_pembelajaran(count)
          )
        `)
        .order('nama_mapel', { ascending: true })
      
      const { data: guru } = await supabase.from('profiles').select('id, nama_lengkap').contains('roles', ['Guru'])
      const { data: kls } = await supabase.from('kelas').select('id, nama_kelas, tingkat').order('nama_kelas', { ascending: true })

      if (mapel) setSubjects(mapel)
      if (guru) setTeachers(guru)
      if (kls) setClasses(kls)
    } finally {
      setFetching(false)
    }
  }

  // --- LOGIKA FILTER & PAGINATION ---
  const filteredData = subjects.filter(s => 
    s.nama_mapel?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // --- LOGIKA SELECTION ---
  const handleSelectAll = () => {
  if (selectedIds.length === currentData.length && currentData.length > 0) {
    setSelectedIds([])
  } else {
    // Tambahkan (s: any)
    setSelectedIds(currentData.map((s: any) => s.id))
  }
}

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleDeleteBulk = async () => {
    if (confirm(`Hapus ${selectedIds.length} Mata Pelajaran terpilih?`)) {
      setLoading(true)
      try {
        const { error } = await supabase.from('mata_pelajaran').delete().in('id', selectedIds)
        if (error) throw error
        setSelectedIds([])
        fetchData()
      } catch (err: any) { alert(err.message) }
      finally { setLoading(false) }
    }
  }

  // --- LOGIKA FORM (ADD/EDIT) ---
  const handleOpenAdd = () => {
    setIsEditMode(false)
    setFormData(initialFormState)
    setIsDialogOpen(true)
  }

  const handleEditClick = (p: any, mapelName: string) => {
    setIsEditMode(true)
    setSelectedPengampu(p)
    setFormData({
      nama_mapel: mapelName,
      kelas_ids: [p.kelas_id],
      guru_id: p.guru_id,
      kktp: p.kktp.toString(),
      tingkat: p.tingkat ?? ""
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditMode && formData.kelas_ids.length === 0) return alert("Pilih minimal satu kelas!")
    setLoading(true)
    try {
      let mapelId;
      const existingMapel = subjects.find(s => s.nama_mapel.toLowerCase() === formData.nama_mapel.toLowerCase());
      
      if (existingMapel) {
        mapelId = existingMapel.id;
        if (isEditMode) await supabase.from('mata_pelajaran').update({ nama_mapel: formData.nama_mapel }).eq('id', mapelId)
      } else {
        const { data: newMapel } = await supabase.from('mata_pelajaran').insert([{ nama_mapel: formData.nama_mapel }]).select().single()
        mapelId = newMapel.id
      }

      if (isEditMode) {
        const { error } = await supabase.from('mapel_pengampu').update({
          guru_id: formData.guru_id,
          kktp: parseInt(formData.kktp),
          tingkat: formData.tingkat,
          kelas_id: formData.kelas_ids[0]
        }).eq('id', selectedPengampu.id)
        if (error) throw error
      } else {
        // Tambahkan (id: string)
const payload = formData.kelas_ids.map((id: string) => ({
  mapel_id: mapelId, 
  kelas_id: id, 
  guru_id: formData.guru_id, 
  kktp: parseInt(formData.kktp), 
  tingkat: formData.tingkat
}))
        const { error } = await supabase.from('mapel_pengampu').insert(payload)
        if (error) throw error
      }
      
      setIsDialogOpen(false)
      fetchData()
      alert("✅ Tersimpan!")
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  // --- LOGIKA TP ---
  const handleOpenTP = async (p: any) => {
    setSelectedPengampu(p)
    setIsTPDialogOpen(true)
    fetchTP(p.id)
  }

  const fetchTP = async (pengampuId: string) => {
    const { data } = await supabase.from('tujuan_pembelajaran').select('*').eq('pengampu_id', pengampuId).order('created_at', { ascending: true })
    if (data) setTpList(data)
  }

  const handleAddTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('tujuan_pembelajaran').insert([{
        pengampu_id: selectedPengampu.id, kode_tp: tpFormData.kode_tp, deskripsi_tp: tpFormData.deskripsi_tp
      }])
      if (error) throw error
      setTpFormData({ kode_tp: "", deskripsi_tp: "" })
      fetchTP(selectedPengampu.id)
      fetchData()
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleDeleteTP = async (id: string) => {
    await supabase.from('tujuan_pembelajaran').delete().eq('id', id)
    fetchTP(selectedPengampu.id)
    fetchData()
  }

  const handleDeletePengampu = async (id: string) => {
    if (confirm("Hapus pengampu ini?")) {
      await supabase.from('mapel_pengampu').delete().eq('id', id)
      fetchData()
    }
  }

  const handleClassToggle = (classId: string) => {
  // Tambahkan (prev: any) dan (id: string)
  setFormData((prev: any) => ({
    ...prev,
    kelas_ids: prev.kelas_ids.includes(classId) 
      ? prev.kelas_ids.filter((id: string) => id !== classId) 
      : [...prev.kelas_ids, classId]
  }))
}

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" /> Referensi Mapel
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">Total {subjects.length} Mata Pelajaran</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <Button onClick={handleDeleteBulk} variant="destructive" className="rounded-xl font-bold animate-in zoom-in h-11">
              <Trash className="w-4 h-4 mr-2" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button onClick={handleOpenAdd} className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
            <Plus className="w-4 h-4 mr-2" /> Mapping Mapel
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Nama Mapel..." 
              className="pl-12 rounded-2xl h-11 bg-muted/30 border-none"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Halaman {currentPage} / {totalPages || 1}</span>
        </div>

        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-6">
                <Checkbox checked={selectedIds.length === currentData.length && currentData.length > 0} onCheckedChange={handleSelectAll} />
              </TableHead>
              <TableHead className="font-black text-[10px] uppercase">ID & Mata Pelajaran</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Daftar Kelas & Guru</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">KKTP</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">TP</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : currentData.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="p-10 text-center text-muted-foreground font-bold italic">Data mapel tidak ditemukan.</TableCell></TableRow>
            ) : currentData.map((mapel) => (
              <TableRow key={mapel.id} className={`hover:bg-muted/5 transition-colors border-border/50 align-top ${selectedIds.includes(mapel.id) ? "bg-primary/5" : ""}`}>
                <TableCell className="p-6">
                  <Checkbox checked={selectedIds.includes(mapel.id)} onCheckedChange={() => handleSelectOne(mapel.id)} />
                </TableCell>
                <TableCell className="py-6">
                  <div className="text-[9px] font-black text-muted-foreground uppercase mb-1 tracking-tighter">ID: {mapel.id.split('-')[0]}</div>
                  <div className="font-black text-sm text-primary uppercase">{mapel.nama_mapel}</div>
                </TableCell>
                <TableCell className="py-2">
                  <div className="space-y-3">
                    {mapel.mapel_pengampu?.map((p: any) => (
                      <div key={p.id} className="flex flex-col border-l-2 border-primary/20 pl-3 py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="rounded-lg text-[9px] font-black h-5">{p.kelas?.nama_kelas}</Badge>
                          <span className="text-xs font-bold">{p.guru?.nama_lengkap}</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Tingkat {p.tingkat}</div>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="space-y-3 py-2">
                    {mapel.mapel_pengampu?.map((p: any) => (
                      <div key={p.id} className="h-10 flex items-center justify-center">
                        <Badge className="bg-green-500/10 text-green-600 border-none font-black text-[10px]">{p.kktp}</Badge>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="space-y-3 py-2">
                    {mapel.mapel_pengampu?.map((p: any) => (
                      <div key={p.id} className="h-10 flex items-center justify-center">
                         <Button onClick={() => handleOpenTP({...p, mapel})} variant="ghost" size="sm" className="h-7 gap-1 text-[10px] font-black hover:bg-primary/10 rounded-lg">
                            <Target className="w-3 h-3" /> {p.tp_count?.[0]?.count || 0} TP
                         </Button>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right p-6">
                  <div className="space-y-3 py-2">
                    {mapel.mapel_pengampu?.map((p: any) => (
                      <div key={p.id} className="h-10 flex items-center justify-end gap-1">
                        <Button onClick={() => handleEditClick(p, mapel.nama_mapel)} variant="ghost" size="icon" className="h-8 w-8 text-primary rounded-xl hover:bg-primary/5"><Edit3 className="w-4 h-4"/></Button>
                        <Button onClick={() => handleDeletePengampu(p.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-xl hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-6 border-t border-border/50 flex items-center justify-between">
          <div className="flex gap-1">
             <Button variant="ghost" size="icon" className="rounded-xl" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="w-4 h-4"/></Button>
             <Button variant="ghost" size="icon" className="rounded-xl" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="w-4 h-4"/></Button>
          </div>
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest font-bold">Total {filteredData.length}</span>
        </div>
      </Card>

      {/* DIALOG FORM (ADD/EDIT) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <form onSubmit={handleSubmit} className="space-y-6 flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{isEditMode ? "Edit Pemetaan" : "Mapping Mata Pelajaran"}</DialogTitle>
              <DialogDescription>{isEditMode ? "Ubah detail pengampu mata pelajaran." : "Hubungkan Mapel dengan Guru dan banyak kelas."}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-5 pb-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black ml-1">Nama Mata Pelajaran</Label>
                  <Input placeholder="Matematika" value={formData.nama_mapel} onChange={e => setFormData({...formData, nama_mapel: e.target.value})} className="rounded-xl border-none bg-muted/40 h-12" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black ml-1">Tingkat</Label>
                    <Select value={formData.tingkat} onValueChange={v => setFormData({...formData, tingkat: v})}>
                      <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue placeholder="Pilih"/></SelectTrigger>
                      <SelectContent>{["X", "XI", "XII", "7", "8", "9"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black ml-1">KKTP</Label>
                    <Input type="number" value={formData.kktp} onChange={e => setFormData({...formData, kktp: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-center" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black ml-1">Guru Pengampu</Label>
                  <Select value={formData.guru_id} onValueChange={v => setFormData({...formData, guru_id: v})}>
                    <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue placeholder="Pilih Guru"/></SelectTrigger>
                    <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.nama_lengkap}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-black ml-1 text-primary">Pilih Daftar Kelas</Label>
                  {isEditMode ? (
                    <div className="grid gap-2">
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary text-xs font-bold flex items-center gap-2">
                         <Badge variant="outline" className="bg-background">{classes.find(c => c.id === formData.kelas_ids[0])?.nama_kelas}</Badge>
                         <span className="text-[10px] text-muted-foreground italic">(Kelas tidak bisa diubah saat edit mapping)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {classes.map((kls) => (
                        <label key={kls.id} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.kelas_ids.includes(kls.id) ? "bg-primary/5 border-primary shadow-sm" : "border-border/50 hover:bg-muted"}`}>
                          <Checkbox checked={formData.kelas_ids.includes(kls.id)} onCheckedChange={() => handleClassToggle(kls.id)} />
                          <span className="text-xs font-bold">{kls.nama_kelas}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t flex-shrink-0">
              <Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIMPAN PERUBAHAN"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG MANAJEMEN TP */}
      <Dialog open={isTPDialogOpen} onOpenChange={setIsTPDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black">Tujuan Pembelajaran (TP)</DialogTitle>
            <DialogDescription>Mapel: <span className="text-primary font-bold">{selectedPengampu?.mapel?.nama_mapel}</span> - {selectedPengampu?.kelas?.nama_kelas}</DialogDescription>
          </DialogHeader>
          <div className="px-8 pb-6 border-b border-dashed">
            <form onSubmit={handleAddTP} className="flex gap-2">
              <div className="w-24">
                <Label className="text-[9px] uppercase font-black ml-1">Kode</Label>
                <Input placeholder="TP 1" value={tpFormData.kode_tp} onChange={e => setTpFormData({...tpFormData, kode_tp: e.target.value})} className="rounded-xl border-none bg-muted/40 h-10 text-xs font-bold" required />
              </div>
              <div className="flex-1">
                <Label className="text-[9px] uppercase font-black ml-1">Deskripsi TP</Label>
                <Input placeholder="Contoh: Memahami logika pemrograman..." value={tpFormData.deskripsi_tp} onChange={e => setTpFormData({...tpFormData, deskripsi_tp: e.target.value})} className="rounded-xl border-none bg-muted/40 h-10 text-xs" required />
              </div>
              <Button type="submit" disabled={loading} className="mt-5 rounded-xl h-10 w-10 p-0 shadow-lg">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
              </Button>
            </form>
          </div>
          <ScrollArea className="flex-1 px-8 py-4 bg-muted/5">
            <div className="space-y-3 pb-8">
              {tpList.length === 0 ? <div className="text-center py-10 text-muted-foreground text-xs italic">Belum ada TP.</div> : 
                tpList.map((tp, index) => (
                  <div key={tp.id} className="group flex items-start gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/30 transition-all shadow-sm">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] shrink-0">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-primary uppercase">{tp.kode_tp}</p>
                      <p className="text-xs font-medium">{tp.deskripsi_tp}</p>
                    </div>
                    <Button onClick={() => handleDeleteTP(tp.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))
              }
            </div>
          </ScrollArea>
          <div className="p-6 bg-muted/20 border-t text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Total {tpList.length} TP Terdaftar
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}