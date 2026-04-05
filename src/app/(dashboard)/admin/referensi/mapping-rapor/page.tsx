"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Columns, Plus, Loader2, Edit3, 
  Trash2, Layers, ArrowDownAz, GripVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function MappingRaporPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [mappings, setMappings] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [activeTingkat, setActiveTingkat] = useState("X")
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    mapel_id: "",
    kelompok_id: "",
    urutan: "1",
    tingkat: "X"
  })

  useEffect(() => {
    fetchInitialData()
    fetchMappings()
  }, [activeTingkat])

  const fetchInitialData = async () => {
    const { data: m } = await supabase.from('mata_pelajaran').select('id, nama_mapel').order('nama_mapel')
    const { data: k } = await supabase.from('kelompok_mapel').select('id, nama_kelompok, kode').eq('is_active', true)
    if (m) setSubjects(m)
    if (k) setGroups(k)
  }

  const fetchMappings = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('mapping_rapor')
        .select(`
          *,
          mapel:mata_pelajaran(nama_mapel),
          kelompok:kelompok_mapel(nama_kelompok, kode)
        `)
        .eq('tingkat', activeTingkat)
        .order('urutan', { ascending: true })
      
      if (data) setMappings(data)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...formData, urutan: parseInt(formData.urutan), tingkat: activeTingkat }
      
      if (isEditMode && selectedId) {
        await supabase.from('mapping_rapor').update(payload).eq('id', selectedId)
      } else {
        await supabase.from('mapping_rapor').insert([payload])
      }
      
      setIsDialogOpen(false)
      fetchMappings()
      alert("✅ Mapping Berhasil Disimpan!")
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleEdit = (item: any) => {
    setIsEditMode(true)
    setSelectedId(item.id)
    setFormData({
      mapel_id: item.mapel_id,
      kelompok_id: item.kelompok_id,
      urutan: item.urutan.toString(),
      tingkat: item.tingkat
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Hapus mapping urutan ini?")) {
      await supabase.from('mapping_rapor').delete().eq('id', id)
      fetchMappings()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Columns className="w-8 h-8 text-primary" /> Mapping Rapor
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">Atur Urutan & Kelompok Mapel di Lembar Rapor</p>
        </div>
        <Button onClick={() => { setIsEditMode(false); setFormData({...formData, mapel_id: ""}); setIsDialogOpen(true); }} className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11">
          <Plus className="w-4 h-4 mr-2" /> Tambah Urutan
        </Button>
      </div>

      <Tabs defaultValue="X" className="w-full" onValueChange={setActiveTingkat}>
        <TabsList className="bg-card/40 backdrop-blur-md p-1 rounded-2xl border border-border/50 mb-4 h-14 w-full md:w-fit grid grid-cols-3">
          <TabsTrigger value="X" className="rounded-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white">Tingkat X</TabsTrigger>
          <TabsTrigger value="XI" className="rounded-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white">Tingkat XI</TabsTrigger>
          <TabsTrigger value="XII" className="rounded-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white">Tingkat XII</TabsTrigger>
        </TabsList>

        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-none">
                <TableHead className="w-20 p-6 text-center font-black text-[10px] uppercase">Urutan</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-primary">Mata Pelajaran</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Kelompok</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase p-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetching ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : mappings.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="p-20 text-center text-muted-foreground font-bold italic">Belum ada mapping untuk tingkat ini.</TableCell></TableRow>
              ) : mappings.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/5 transition-colors border-border/50 group">
                  <TableCell className="text-center font-black text-primary text-lg">{item.urutan}</TableCell>
                  <TableCell className="font-bold text-sm uppercase">{item.mapel?.nama_mapel}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg gap-2 font-black border-primary/30 text-primary bg-primary/5">
                      <Layers className="w-3 h-3" /> {item.kelompok?.nama_kelompok || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right p-6">
                    <div className="flex justify-end gap-1">
                      <Button onClick={() => handleEdit(item)} variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 text-primary">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="rounded-xl hover:bg-red-50 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Tabs>

      {/* DIALOG TAMBAH/EDIT */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{isEditMode ? "Edit Urutan" : "Tambah Urutan"}</DialogTitle>
              <DialogDescription>Tingkat <span className="font-bold text-primary">{activeTingkat}</span></DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Mata Pelajaran</Label>
                <Select value={formData.mapel_id} onValueChange={v => setFormData({...formData, mapel_id: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue placeholder="Pilih Mapel"/></SelectTrigger>
                  <SelectContent>
                    {subjects.map(m => <SelectItem key={m.id} value={m.id}>{m.nama_mapel}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Kelompok</Label>
                <Select value={formData.kelompok_id} onValueChange={v => setFormData({...formData, kelompok_id: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue placeholder="Pilih Kelompok"/></SelectTrigger>
                  <SelectContent>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.nama_kelompok} ({g.kode})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Urutan Tampil (Angka)</Label>
                <Input 
                  type="number"
                  value={formData.urutan}
                  onChange={e => setFormData({...formData, urutan: e.target.value})}
                  className="rounded-xl border-none bg-muted/40 h-11 font-black text-primary"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIMPAN MAPPING"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}