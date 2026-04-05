"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Trophy, Plus, Search, Loader2, Edit3, 
  Trash2, UserCheck, LayoutGrid, X, Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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

export default function ReferensiEkskulPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [ekskulList, setEkskulList] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedEkskul, setSelectedEkskul] = useState<any>(null)

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
      // 1. Ambil Data Ekskul + Join Pembina
      const { data: ekskul } = await supabase
        .from('ekskul')
        .select(`
          *,
          pembina:profiles!pembina_id(nama_lengkap)
        `)
        .order('nama_ekskul', { ascending: true })

      // 2. Ambil Data Guru (untuk Pembina)
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
        await supabase.from('ekskul').update(formData).eq('id', selectedEkskul.id)
      } else {
        await supabase.from('ekskul').insert([formData])
      }
      setIsDialogOpen(false)
      fetchData()
      alert("✅ Data Berhasil Disimpan!")
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Hapus ekstrakurikuler ini?")) {
      await supabase.from('ekskul').delete().eq('id', id)
      fetchData()
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

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" /> Referensi Ekskul
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">Daftar Kegiatan Ekstrakurikuler</p>
        </div>
        <Button onClick={handleOpenAdd} className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11">
          <Plus className="w-4 h-4 mr-2" /> Tambah Ekskul
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-16 p-6 text-center font-black text-[10px] uppercase">No</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-primary">Nama Ekstrakurikuler</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Pembina (Guru)</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : ekskulList.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-medium italic">Belum ada data ekskul.</TableCell></TableRow>
            ) : ekskulList.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-muted/5 transition-colors border-border/50">
                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-black text-sm uppercase">{item.nama_ekskul}</TableCell>
                <TableCell className="text-xs font-bold flex items-center gap-2 py-4">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UserCheck className="w-3 h-3" />
                  </div>
                  {item.pembina?.nama_lengkap || <span className="text-muted-foreground italic font-normal">Belum ditentukan</span>}
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
              <DialogTitle className="text-2xl font-black">{isEditMode ? "Edit Ekskul" : "Tambah Ekskul"}</DialogTitle>
              <DialogDescription>Input kegiatan ekstrakurikuler beserta pembina gurunya.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Nama Ekstrakurikuler</Label>
                <Input 
                  placeholder="Contoh: Pramuka, OSIS, Futsal" 
                  value={formData.nama_ekskul}
                  onChange={e => setFormData({...formData, nama_ekskul: e.target.value})}
                  className="rounded-xl border-none bg-muted/40 h-12"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Pembina (Guru)</Label>
                <Select 
                  value={formData.pembina_id} 
                  onValueChange={v => setFormData({...formData, pembina_id: v})}
                >
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11">
                    <SelectValue placeholder="Pilih Guru Pembina" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nama_lengkap}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIMPAN DATA EKSKUL"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}