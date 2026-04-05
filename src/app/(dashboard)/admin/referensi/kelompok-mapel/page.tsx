"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Library, Plus, Search, Loader2, Edit3, 
  Trash2, Layers, CheckCircle2, XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"

export default function KelompokMapelPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [groups, setGroups] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)

  const [formData, setFormData] = useState({
    kode: "",
    nama_kelompok: "",
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('kelompok_mapel')
        .select('*')
        .ilike('nama_kelompok', `%${searchQuery}%`)
        .order('kode', { ascending: true })
      
      if (data) setGroups(data)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditMode) {
        await supabase.from('kelompok_mapel').update(formData).eq('id', selectedGroup.id)
      } else {
        await supabase.from('kelompok_mapel').insert([formData])
      }
      setIsDialogOpen(false)
      fetchData()
      alert("✅ Kelompok Mapel Berhasil Disimpan!")
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Hapus kelompok mapel ini?")) {
      await supabase.from('kelompok_mapel').delete().eq('id', id)
      fetchData()
    }
  }

  const handleEditClick = (group: any) => {
    setIsEditMode(true)
    setSelectedGroup(group)
    setFormData({
      kode: group.kode,
      nama_kelompok: group.nama_kelompok,
      is_active: group.is_active
    })
    setIsDialogOpen(true)
  }

  const handleOpenAdd = () => {
    setIsEditMode(false)
    setFormData({ kode: "", nama_kelompok: "", is_active: true })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Library className="w-8 h-8 text-primary" /> Kelompok Mapel
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">Kategori Pengelompokan Mata Pelajaran</p>
        </div>
        <Button onClick={handleOpenAdd} className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11">
          <Plus className="w-4 h-4 mr-2" /> Tambah Kelompok
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Kelompok..." 
              className="pl-12 rounded-2xl h-11 bg-muted/30 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-20 p-6 text-center font-black text-[10px] uppercase">Kode</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-primary">Nama Kelompok</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">Status</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : groups.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-medium italic">Belum ada data kelompok mapel.</TableCell></TableRow>
            ) : groups.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/5 transition-colors border-border/50">
                <TableCell className="text-center font-black text-primary p-6">{item.kode}</TableCell>
                <TableCell className="font-bold text-sm uppercase tracking-tight">{item.nama_kelompok}</TableCell>
                <TableCell className="text-center">
                  {item.is_active ? (
                    <Badge className="bg-green-500/10 text-green-600 border-none rounded-lg gap-1 font-black text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> AKTIF
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600 border-none rounded-lg gap-1 font-black text-[10px]">
                      <XCircle className="w-3 h-3" /> NON-AKTIF
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right p-6">
                  <div className="flex justify-end gap-1">
                    <Button onClick={() => handleEditClick(item)} variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 text-primary">
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

      {/* DIALOG TAMBAH/EDIT */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{isEditMode ? "Edit Kelompok" : "Tambah Kelompok"}</DialogTitle>
              <DialogDescription>Gunakan kode unik untuk membedakan kategori mata pelajaran.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Kode Kelompok</Label>
                <Input 
                  placeholder="Contoh: A, B, atau Umum" 
                  value={formData.kode}
                  onChange={e => setFormData({...formData, kode: e.target.value})}
                  className="rounded-xl border-none bg-muted/40 h-12 font-black text-primary"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Nama Kelompok</Label>
                <Input 
                  placeholder="Contoh: Kelompok Kejuruan" 
                  value={formData.nama_kelompok}
                  onChange={e => setFormData({...formData, nama_kelompok: e.target.value})}
                  className="rounded-xl border-none bg-muted/40 h-12"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-[10px] uppercase font-black">Status Aktif</Label>
                  <p className="text-[9px] text-muted-foreground">Kelompok yang non-aktif tidak muncul di form mapel.</p>
                </div>
                <Switch 
                  checked={formData.is_active}
                  onCheckedChange={(val) => setFormData({...formData, is_active: val})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIMPAN KELOMPOK"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}