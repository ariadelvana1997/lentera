"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  CalendarDays, Plus, Loader2, Edit3, 
  Trash2, MapPin, Calendar, CheckCircle2
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
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export default function TanggalRaporPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [configList, setConfigList] = useState<any[]>([])
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    semester: "Ganjil",
    lokasi: "",
    tanggal_terbit: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('konfigurasi_rapor')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setConfigList(data)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditMode && selectedId) {
        await supabase.from('konfigurasi_rapor').update(formData).eq('id', selectedId)
      } else {
        await supabase.from('konfigurasi_rapor').insert([formData])
      }
      
      setIsDialogOpen(false)
      fetchData()
      alert("✅ Konfigurasi Titi Mangsa Berhasil Disimpan!")
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleEdit = (item: any) => {
    setIsEditMode(true)
    setSelectedId(item.id)
    setFormData({
      semester: item.semester,
      lokasi: item.lokasi,
      tanggal_terbit: item.tanggal_terbit
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Hapus konfigurasi tanggal ini?")) {
      await supabase.from('konfigurasi_rapor').delete().eq('id', id)
      fetchData()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" /> Tanggal Rapor
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">Atur Titi Mangsa Penerbitan Rapor</p>
        </div>
        <Button onClick={() => { setIsEditMode(false); setFormData({semester:"Ganjil", lokasi:"", tanggal_terbit:""}); setIsDialogOpen(true); }} className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
          <Plus className="w-4 h-4 mr-2" /> Atur Tanggal
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-16 p-6 text-center font-black text-[10px] uppercase">No</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-primary">Semester</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Lokasi & Tanggal Terbit</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : configList.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="p-20 text-center text-muted-foreground font-bold italic">Belum ada konfigurasi tanggal rapor.</TableCell></TableRow>
            ) : configList.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-muted/5 transition-colors border-border/50">
                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <Badge className="rounded-lg font-black bg-primary/10 text-primary border-none uppercase text-[10px]">
                    Semester {item.semester}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <MapPin className="w-3 h-3 text-muted-foreground" /> {item.lokasi}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" /> 
                      {format(new Date(item.tanggal_terbit), 'dd MMMM yyyy', { locale: idLocale })}
                    </div>
                  </div>
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

      {/* DIALOG TAMBAH/EDIT */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{isEditMode ? "Edit Tanggal" : "Atur Tanggal Rapor"}</DialogTitle>
              <DialogDescription>Data ini akan muncul di bagian tanda tangan raport siswa.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Pilih Semester</Label>
                <Select value={formData.semester} onValueChange={v => setFormData({...formData, semester: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ganjil">Semester Ganjil</SelectItem>
                    <SelectItem value="Genap">Semester Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Lokasi Penerbitan</Label>
                <Input 
                  placeholder="Contoh: Jakarta" 
                  value={formData.lokasi}
                  onChange={e => setFormData({...formData, lokasi: e.target.value})}
                  className="rounded-xl border-none bg-muted/40 h-11"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black ml-1">Tanggal Terbit Rapor</Label>
                <Input 
                  type="date"
                  value={formData.tanggal_terbit}
                  onChange={e => setFormData({...formData, tanggal_terbit: e.target.value})}
                  className="rounded-xl border-none bg-muted/40 h-11"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIMPAN KONFIGURASI"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}