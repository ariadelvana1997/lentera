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
import { ScrollArea } from "@/components/ui/scroll-area" // SUDAH DIDEFINISIKAN DI SINI
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
    
    if (m) {
      // --- LOGIKA SUPER FILTER (ANTI-GANDA TOTAL) ---
      // Kita bersihkan spasi dan abaikan besar/kecil huruf saat menyaring
      const uniqueMapel = Array.from(
        new Map(
          m.map((item) => [
            item.nama_mapel.trim().toLowerCase(), // Kunci unik: tanpa spasi & huruf kecil
            item
          ])
        ).values()
      );
      setSubjects(uniqueMapel)
    }
    if (k) setGroups(k)
  }

  const fetchMappings = async () => {
    setFetching(true)
    try {
      const { data } = await supabase
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
      alert("✅ Tersimpan!")
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
    if (confirm("Hapus mapping ini?")) {
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
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest leading-none mt-1">Urutan Mapel di Lembar Rapor</p>
        </div>
        <Button onClick={() => { setIsEditMode(false); setFormData({...formData, mapel_id: ""}); setIsDialogOpen(true); }} className="rounded-xl font-black shadow-lg shadow-primary/20 h-11 px-6">
          <Plus className="w-4 h-4 mr-2" /> TAMBAH URUTAN
        </Button>
      </div>

      <Tabs defaultValue="X" className="w-full" onValueChange={setActiveTingkat}>
        <TabsList className="bg-card/40 backdrop-blur-md p-1 rounded-2xl border border-border/50 mb-6 h-14 w-full md:w-fit grid grid-cols-3">
          <TabsTrigger value="X" className="rounded-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Tingkat X</TabsTrigger>
          <TabsTrigger value="XI" className="rounded-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Tingkat XI</TabsTrigger>
          <TabsTrigger value="XII" className="rounded-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Tingkat XII</TabsTrigger>
        </TabsList>

        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-none">
                <TableHead className="w-20 p-6 text-center font-black text-[10px] uppercase text-muted-foreground">Urutan</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-primary tracking-widest">Mata Pelajaran</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">Kelompok</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase p-6 text-muted-foreground tracking-widest">Opsi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetching ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : mappings.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="p-24 text-center text-muted-foreground font-bold  tracking-widest opacity-40 uppercase text-[10px]">Belum ada mapping untuk tingkat ini.</TableCell></TableRow>
              ) : mappings.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/5 transition-colors border-border/50 group">
                  <TableCell className="text-center font-black text-primary text-xl ">{item.urutan}</TableCell>
                  <TableCell className="font-black text-sm uppercase  text-foreground">{item.mapel?.nama_mapel}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg gap-2 font-black border-primary/30 text-primary bg-primary/5 uppercase text-[9px] px-3 py-1">
                      <Layers className="w-3 h-3" /> {item.kelompok?.nama_kelompok || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right p-6">
                    <div className="flex justify-end gap-1">
                      <Button onClick={() => handleEdit(item)} variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 text-primary transition-all"><Edit3 className="w-4 h-4" /></Button>
                      <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="rounded-xl hover:bg-red-50 text-red-500 transition-all"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none shadow-2xl focus-visible:outline-none bg-white/95 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase  tracking-tighter">{isEditMode ? "Edit Urutan Rapor" : "Tambah Urutan Rapor"}</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest">Tingkat <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{activeTingkat}</span></DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1 text-muted-foreground">Pilih Mata Pelajaran</Label>
                <Select value={formData.mapel_id} onValueChange={v => setFormData({...formData, mapel_id: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"><SelectValue placeholder="Pilih Mapel..."/></SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[400px]">
                    <ScrollArea className="h-[300px]">
                      {subjects.map(m => (
                        <SelectItem key={m.id} value={m.id} className="font-bold text-xs uppercase  cursor-pointer">
                          {m.nama_mapel}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1 text-muted-foreground">Pilih Kelompok Mapel</Label>
                <Select value={formData.kelompok_id} onValueChange={v => setFormData({...formData, kelompok_id: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"><SelectValue placeholder="Pilih Kelompok..."/></SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id} className="font-bold text-xs uppercase">{g.nama_kelompok} ({g.kode})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1 text-muted-foreground">Urutan Tampil (Nomor)</Label>
                <Input type="number" value={formData.urutan} onChange={e => setFormData({...formData, urutan: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-black text-primary text-sm" placeholder="Contoh: 1" required />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20 uppercase tracking-widest text-xs " disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "SIMPAN KONFIGURASI MAPPING"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}