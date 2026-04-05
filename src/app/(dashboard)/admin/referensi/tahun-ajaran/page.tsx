"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Calendar, Plus, Trash2, Loader2, 
  CheckCircle2, AlertCircle, CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function TahunAjaranPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [years, setYears] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    tahun: "",
    semester: "Ganjil",
  })

  useEffect(() => {
    fetchYears()
  }, [])

  const fetchYears = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('tahun_ajaran')
        .select('*')
        .order('tahun_ajaran', { ascending: false })
      
      if (data) setYears(data)
      if (error) throw error
    } catch (err: any) {
      console.error(err.message)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('tahun_ajaran')
        .insert([{ 
          tahun_ajaran: formData.tahun, 
          semester: formData.semester,
          is_aktif: false // Default tidak aktif saat dibuat
        }])
      
      if (error) throw error
      setIsDialogOpen(false)
      setFormData({ tahun: "", semester: "Ganjil" })
      fetchYears()
    } catch (err: any) {
      alert("Gagal menambah: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSetActive = async (id: string) => {
    setLoading(true)
    try {
      // 1. Nonaktifkan semua tahun ajaran dulu
      await supabase
        .from('tahun_ajaran')
        .update({ is_aktif: false })
        .not('id', 'eq', '00000000-0000-0000-0000-000000000000') // Dummy reset

      // 2. Aktifkan yang dipilih
      const { error } = await supabase
        .from('tahun_ajaran')
        .update({ is_aktif: true })
        .eq('id', id)

      if (error) throw error
      fetchYears()
    } catch (err: any) {
      alert("Gagal mengaktifkan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Hapus tahun ajaran ini?")) {
      const { error } = await supabase.from('tahun_ajaran').delete().eq('id', id)
      if (!error) fetchYears()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            Tahun Ajaran
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">Tentukan tahun pelajaran dan semester yang sedang berjalan.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl h-11 gap-2 font-bold shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          Tambah Tahun
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-black text-[10px] uppercase tracking-widest p-6 text-muted-foreground">Tahun Pelajaran</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Semester</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest p-6 text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : years.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-medium">Belum ada data tahun ajaran.</TableCell></TableRow>
            ) : (
              years.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/10 transition-colors border-border/50">
                  <TableCell className="p-6 font-bold text-sm">{item.tahun_ajaran}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg font-bold border-primary/20 text-primary">
                      {item.semester}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.is_aktif ? (
                      <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        Aktif
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Tidak Aktif</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right p-6">
                    <div className="flex justify-end gap-2">
                      {!item.is_aktif && (
                        <Button 
                          onClick={() => handleSetActive(item.id)} 
                          variant="ghost" size="sm" 
                          className="rounded-xl font-bold text-xs hover:bg-green-50 hover:text-green-600"
                        >
                          Aktifkan
                        </Button>
                      )}
                      <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="rounded-xl hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8 border-none shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Tahun Ajaran Baru</DialogTitle>
              <DialogDescription>Tambahkan periode akademik sekolah.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Tahun Pelajaran</Label>
                <Input 
                  placeholder="Contoh: 2024/2025" 
                  value={formData.tahun}
                  onChange={(e) => setFormData({...formData, tahun: e.target.value})}
                  className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Semester</Label>
                <Select 
                  value={formData.semester} 
                  onValueChange={(val) => setFormData({...formData, semester: val})}
                >
                  <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none focus:ring-1">
                    <SelectValue placeholder="Pilih Semester" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="Ganjil">Ganjil</SelectItem>
                    <SelectItem value="Genap">Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-xl font-black" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Tahun Ajaran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}