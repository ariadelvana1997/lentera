"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Users, Plus, Search, Loader2, Edit3, 
  Trash2, UserCheck, Layout, Crosshair,
  UserPlus, Check, X, ShieldCheck
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

export default function KelompokKokurikulerPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [groups, setGroups] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMappingOpen, setIsMappingOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)

  const [formData, setFormData] = useState({
    nama_kelompok: "",
    kegiatan_id: "",
    koordinator_id: ""
  })

  const [mappingSelection, setMappingSelection] = useState<string[]>([])

  useEffect(() => {
    fetchInitialData()
    fetchGroups()
  }, [])

  const fetchInitialData = async () => {
    const { data: t } = await supabase.from('profiles').select('id, nama_lengkap').contains('roles', ['Guru'])
    const { data: a } = await supabase.from('kegiatan_kokurikuler').select('id, judul_kegiatan')
    const { data: s } = await supabase.from('profiles').select('id, nama_lengkap').contains('roles', ['Siswa'])
    
    if (t) setTeachers(t)
    if (a) setActivities(a)
    if (s) setStudents(s)
  }

  const fetchGroups = async () => {
    setFetching(true)
    try {
      const { data } = await supabase
        .from('kelompok_kokurikuler')
        .select(`
          *,
          kegiatan:kegiatan_kokurikuler(judul_kegiatan),
          koordinator:profiles!koordinator_id(nama_lengkap),
          anggota_count:anggota_kokurikuler(count)
        `)
        .order('created_at', { ascending: false })
      if (data) setGroups(data)
    } finally { setFetching(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditMode) {
        await supabase.from('kelompok_kokurikuler').update(formData).eq('id', selectedGroup.id)
      } else {
        await supabase.from('kelompok_kokurikuler').insert([formData])
      }
      setIsDialogOpen(false)
      fetchGroups()
      alert("✅ Kelompok Berhasil Disimpan!")
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleOpenMapping = async (group: any) => {
    setSelectedGroup(group)
    setLoading(true)
    const { data } = await supabase.from('anggota_kokurikuler').select('siswa_id').eq('kelompok_id', group.id)
    if (data) setMappingSelection(data.map(d => d.siswa_id))
    setIsMappingOpen(true)
    setLoading(false)
  }

  const handleSaveMapping = async () => {
    setLoading(true)
    try {
      await supabase.from('anggota_kokurikuler').delete().eq('kelompok_id', selectedGroup.id)
      if (mappingSelection.length > 0) {
        const payload = mappingSelection.map(id => ({ kelompok_id: selectedGroup.id, siswa_id: id }))
        await supabase.from('anggota_kokurikuler').insert(payload)
      }
      setIsMappingOpen(false)
      fetchGroups()
      alert("✅ Anggota Kelompok Diperbarui!")
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Hapus kelompok ini?")) {
      await supabase.from('kelompok_kokurikuler').delete().eq('id', id)
      fetchGroups()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Kelompok Projek
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">Manajemen Kelompok Kerja Kokurikuler</p>
        </div>
        <Button onClick={() => { setIsEditMode(false); setFormData({nama_kelompok:"", kegiatan_id:"", koordinator_id:""}); setIsDialogOpen(true); }} className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
          <Plus className="w-4 h-4 mr-2" /> Tambah Kelompok
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-16 p-6 text-center font-black text-[10px] uppercase">No</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-primary">Kelompok & Kegiatan</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">Koordinator</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">Anggota</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : groups.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-muted/5 border-border/50">
                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="py-4">
                  <div className="font-black text-sm uppercase">{item.nama_kelompok}</div>
                  <div className="text-[10px] font-bold text-primary flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
                    <Layout className="w-3 h-3" /> {item.kegiatan?.judul_kegiatan}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="rounded-lg gap-2 border-primary/20 text-xs py-1">
                    <ShieldCheck className="w-3 h-3 text-primary" /> {item.koordinator?.nama_lengkap || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                   <Button onClick={() => handleOpenMapping(item)} variant="ghost" className="h-9 gap-2 rounded-xl hover:bg-amber-500/10 text-amber-600 font-black text-xs">
                      <UserPlus className="w-4 h-4" /> {item.anggota_count?.[0]?.count || 0} Siswa
                   </Button>
                </TableCell>
                <TableCell className="text-right p-6">
                  <div className="flex justify-end gap-1">
                    <Button onClick={() => { setIsEditMode(true); setSelectedGroup(item); setFormData({nama_kelompok: item.nama_kelompok, kegiatan_id: item.kegiatan_id, koordinator_id: item.koordinator_id}); setIsDialogOpen(true); }} variant="ghost" size="icon" className="rounded-xl text-primary"><Edit3 className="w-4 h-4"/></Button>
                    <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="rounded-xl text-red-500"><Trash2 className="w-4 h-4"/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* DIALOG TAMBAH/EDIT KELOMPOK */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Data Kelompok Projek</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Nama Kelompok</Label>
                <Input value={formData.nama_kelompok} onChange={e => setFormData({...formData, nama_kelompok: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11" placeholder="Contoh: Kelompok 1 - X PPLG" required />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Pilih Kegiatan P5</Label>
                <Select value={formData.kegiatan_id} onValueChange={v => setFormData({...formData, kegiatan_id: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue placeholder="Pilih Projek" /></SelectTrigger>
                  <SelectContent>{activities.map(a => <SelectItem key={a.id} value={a.id}>{a.judul_kegiatan}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Koordinator (Guru)</Label>
                <Select value={formData.koordinator_id} onValueChange={v => setFormData({...formData, koordinator_id: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue placeholder="Pilih Koordinator" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.nama_lengkap}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg">SIMPAN KELOMPOK</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG MAPPING ANGGOTA (SISWA) */}
      <Dialog open={isMappingOpen} onOpenChange={setIsMappingOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black">Anggota Kelompok</DialogTitle>
            <DialogDescription>Kelompok: <span className="text-primary font-bold">{selectedGroup?.nama_kelompok}</span></DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-8">
            <div className="space-y-2 pb-8">
              {students.map((siswa) => (
                <label key={siswa.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${mappingSelection.includes(siswa.id) ? "bg-primary/5 border-primary shadow-sm" : "border-transparent bg-muted/30"}`}>
                  <span className="text-sm font-bold">{siswa.nama_lengkap}</span>
                  <Checkbox 
                    checked={mappingSelection.includes(siswa.id)} 
                    onCheckedChange={() => setMappingSelection(prev => prev.includes(siswa.id) ? prev.filter(i => i !== siswa.id) : [...prev, siswa.id])}
                  />
                </label>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-muted/20 border-t">
            <Button onClick={handleSaveMapping} className="w-full h-12 rounded-xl font-black shadow-lg" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "UPDATE ANGGOTA PROJEK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}