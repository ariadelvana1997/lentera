"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  LayoutGrid, Plus, Search, Loader2, Edit3, 
  Trash2, Users, UserCheck, BookOpen, GraduationCap,
  X, Check
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

export default function ReferensiKelasPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [classList, setClassList] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  
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

  // State untuk Mapping
  const [mappingSelection, setMappingSelection] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetching(true)
    try {
      // 1. Ambil Data Kelas + Join Nama Wali + Hitung Siswa
      const { data: kelas, error: e1 } = await supabase
        .from('kelas')
        .select(`
          *,
          wali:profiles!wali_id(nama_lengkap),
          siswa_count:siswa_kelas(count)
        `)
        .order('tingkat', { ascending: true })

      // 2. Ambil Data Guru (untuk Wali Kelas)
      const { data: guru } = await supabase
        .from('profiles')
        .select('id, nama_lengkap')
        .contains('roles', ['Guru'])

      if (kelas) setClassList(kelas)
      if (guru) setTeachers(guru)
    } finally {
      setFetching(false)
    }
  }

  const handleOpenMapping = async (kelas: any) => {
    setSelectedClass(kelas)
    setLoading(true)
    try {
      // Ambil semua siswa
      const { data: allSiswa } = await supabase
        .from('profiles')
        .select('id, nama_lengkap, siswa_kelas(kelas_id)')
        .contains('roles', ['Siswa'])

      // Ambil siswa yang sudah ada di kelas ini
      const { data: existingMapping } = await supabase
        .from('siswa_kelas')
        .select('siswa_id')
        .eq('kelas_id', kelas.id)

      if (allSiswa) setAvailableStudents(allSiswa)
      if (existingMapping) setMappingSelection(existingMapping.map(m => m.siswa_id))
      
      setIsMappingOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMapping = async () => {
    setLoading(true)
    try {
      // 1. Hapus mapping lama untuk kelas ini
      await supabase.from('siswa_kelas').delete().eq('kelas_id', selectedClass.id)
      
      // 2. Insert mapping baru
      if (mappingSelection.length > 0) {
        const payload = mappingSelection.map(id => ({
          siswa_id: id,
          kelas_id: selectedClass.id
        }))
        const { error } = await supabase.from('siswa_kelas').insert(payload)
        if (error) throw error
      }
      
      alert("✅ Mapping Siswa Berhasil!")
      setIsMappingOpen(false)
      fetchData()
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...formData }
      if (isEditMode) {
        await supabase.from('kelas').update(payload).eq('id', selectedClass.id)
      } else {
        await supabase.from('kelas').insert([payload])
      }
      setIsClassDialogOpen(false)
      fetchData()
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleDeleteKelas = async (id: string) => {
    if (confirm("Hapus kelas ini? Semua mapping siswa di dalamnya akan ikut terhapus.")) {
      await supabase.from('kelas').delete().eq('id', id)
      fetchData()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-primary" /> Referensi Kelas
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">Pengaturan Rombongan Belajar</p>
        </div>
        <Button onClick={() => { setIsEditMode(false); setFormData({kurikulum: "Merdeka", nama_kelas:"", tingkat:"", wali_id:""}); setIsClassDialogOpen(true); }} className="rounded-xl font-bold shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Tambah Kelas
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-6 text-center font-black text-[10px] uppercase">No</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Kurikulum</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-primary">Nama Kelas</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Tingkat</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Wali Kelas</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">Siswa</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={7} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : classList.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-muted/5 transition-colors border-border/50">
                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                <TableCell><Badge variant="outline" className="rounded-lg text-[10px] font-black uppercase">{item.kurikulum}</Badge></TableCell>
                <TableCell className="font-black text-sm">{item.nama_kelas}</TableCell>
                <TableCell className="font-bold">{item.tingkat}</TableCell>
                <TableCell className="text-xs font-bold">{item.wali?.nama_lengkap || "-"}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" onClick={() => handleOpenMapping(item)} className="h-8 gap-2 rounded-lg hover:bg-primary/10 text-primary font-black text-xs">
                    <Users className="w-3 h-3" />
                    {item.siswa_count?.[0]?.count || 0} Siswa
                  </Button>
                </TableCell>
                <TableCell className="text-right p-6">
                  <div className="flex justify-end gap-1">
                    <Button onClick={() => { setIsEditMode(true); setSelectedClass(item); setFormData({kurikulum: item.kurikulum, nama_kelas: item.nama_kelas, tingkat: item.tingkat, wali_id: item.wali_id}); setIsClassDialogOpen(true); }} variant="ghost" size="icon" className="rounded-xl"><Edit3 className="w-4 h-4"/></Button>
                    <Button onClick={() => handleDeleteKelas(item.id)} variant="ghost" size="icon" className="rounded-xl text-red-500"><Trash2 className="w-4 h-4"/></Button>
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
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{isEditMode ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle>
              <DialogDescription>Tentukan identitas kelas dan wali kelasnya.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Kurikulum</Label>
                <Select value={formData.kurikulum} onValueChange={v => setFormData({...formData, kurikulum: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="Merdeka">Merdeka</SelectItem><SelectItem value="K13">Kurikulum 2013 (K13)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Nama Kelas</Label>
                <Input value={formData.nama_kelas} onChange={e => setFormData({...formData, nama_kelas: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11" placeholder="Contoh: X PPLG 1" required/>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Tingkat</Label>
                <Input value={formData.tingkat} onChange={e => setFormData({...formData, tingkat: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11" placeholder="Contoh: 10 atau X" required/>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Pilih Wali Kelas</Label>
                <Select value={formData.wali_id} onValueChange={v => setFormData({...formData, wali_id: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue placeholder="Pilih Guru"/></SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.nama_lengkap}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIMPAN DATA KELAS"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG MAPPING SISWA */}
      <Dialog open={isMappingOpen} onOpenChange={setIsMappingOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black">Mapping Siswa</DialogTitle>
            <DialogDescription>Kelas: <span className="text-primary font-black">{selectedClass?.nama_kelas}</span></DialogDescription>
          </DialogHeader>

          <div className="px-8 pb-4 relative">
             <Search className="absolute left-11 top-3 w-4 h-4 text-muted-foreground" />
             <Input placeholder="Cari siswa..." className="pl-11 rounded-xl border-none bg-muted/40" />
          </div>

          <ScrollArea className="flex-1 px-8">
            <div className="space-y-2 pb-8">
              {availableStudents.map((siswa) => {
                const isAlreadyInOtherClass = siswa.siswa_kelas?.length > 0 && siswa.siswa_kelas[0].kelas_id !== selectedClass?.id;
                return (
                  <label key={siswa.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${mappingSelection.includes(siswa.id) ? "bg-primary/5 border-primary shadow-sm" : "border-transparent hover:bg-muted/40"}`}>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{siswa.nama_lengkap}</span>
                      {isAlreadyInOtherClass && <span className="text-[9px] text-amber-600 font-bold uppercase">Sudah di Kelas Lain</span>}
                    </div>
                    <Checkbox 
                      checked={mappingSelection.includes(siswa.id)} 
                      onCheckedChange={() => {
                        setMappingSelection(prev => prev.includes(siswa.id) ? prev.filter(i => i !== siswa.id) : [...prev, siswa.id])
                      }}
                    />
                  </label>
                )
              })}
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-muted/20 border-t">
            <Button onClick={handleSaveMapping} className="w-full h-12 rounded-xl font-black" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "UPDATE ANGGOTA KELAS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}