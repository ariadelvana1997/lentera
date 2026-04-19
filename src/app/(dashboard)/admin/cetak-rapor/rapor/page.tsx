"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Printer, Users, Search, Loader2, 
  FileText, UserCircle, LayoutGrid, ChevronRight,
  Settings2, ImageIcon, Trash2, MoveHorizontal, Ghost, Type
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox" // 🚀 Pastikan shadcn checkbox terinstall
import { Slider } from "@/components/ui/slider"     // 🚀 Pastikan shadcn slider terinstall
import {
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog" // 🚀 Pastikan shadcn dialog terinstall
import { toast } from "sonner"
import Link from "next/link"

export default function MenuCetakRaporPage() {
  const [fetching, setFetching] = useState(true)
  const [classList, setClassList] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // 🚀 STATE KHUSUS BULK & MODAL
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkTitle, setBulkTitle] = useState("LAPORAN HASIL BELAJAR")
  const [bulkBg, setBulkBg] = useState<string | null>(null)
  const [bulkScale, setBulkScale] = useState(80)
  const [bulkOpacity, setBulkOpacity] = useState(0.1)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const { data } = await supabase.from('kelas').select('*').order('nama_kelas')
      if (data) setClassList(data)
    } finally {
      setFetching(false)
    }
  }

  const loadStudents = async (classId: string) => {
    setFetching(true)
    setSelectedIds([]) // Reset pilihan saat ganti kelas
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nama_lengkap, nisn, roles')
        .eq('kelas_id', classId)
        .filter('roles', 'cs', '{"Siswa"}')
        .order('nama_lengkap')

      if (error) toast.error(error.message);
      setStudents(data || [])
    } finally {
      setFetching(false)
    }
  }

  // 🚀 HANDLER SELECTION
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredStudents.map(s => s.id))
    } else {
      setSelectedIds([])
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleUploadBg = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBulkBg(URL.createObjectURL(e.target.files[0]))
    }
  }

  const filteredStudents = students.filter(s => 
    s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 uppercase">
            <Printer className="w-8 h-8 text-primary" /> Cetak Rapor
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">
            Pusat Pencetakan Dokumen Hasil Belajar Siswa
          </p>
        </div>

        {/* 🚀 TOMBOL BULK ACTION (Hanya muncul jika ada yang dipilih) */}
        {selectedIds.length > 0 && (
          <Button 
            onClick={() => setIsBulkModalOpen(true)}
            className="rounded-2xl font-black text-xs uppercase px-8 shadow-xl shadow-primary/20 animate-in zoom-in-95"
          >
            <Settings2 className="w-4 h-4 mr-2" /> Opsi Cetak Masal ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* FILTER KELAS */}
      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2rem] p-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="font-black text-[10px] uppercase text-muted-foreground">Pilih Rombel:</span>
          </div>
          <Select 
            onValueChange={(v) => { setSelectedClass(v); loadStudents(v); }}
          >
            <SelectTrigger className="w-full md:w-80 rounded-xl border-none bg-white shadow-sm font-black text-xs h-11">
              <SelectValue placeholder="Klik untuk memilih kelas..." />
            </SelectTrigger>
            <SelectContent>
              {classList.map((k) => (
                <SelectItem key={k.id} value={k.id} className="font-bold uppercase text-[10px]">{k.nama_kelas}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {selectedClass && (
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama siswa..." 
                className="pl-12 rounded-2xl h-11 bg-white border-none font-bold text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-none">
                {/* 🚀 CHECKBOX SELECT ALL */}
                <TableHead className="w-12 text-center p-6">
                  <Checkbox 
                    checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase text-primary">Nama Lengkap Siswa</TableHead>
                <TableHead className="hidden md:table-cell font-black text-[10px] uppercase text-muted-foreground text-center">NISN</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase p-6">Opsi Cetak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetching ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center font-bold text-muted-foreground uppercase text-[10px] ">Siswa tidak ditemukan.</TableCell></TableRow>
              ) : filteredStudents.map((s, index) => (
                <TableRow key={s.id} className="hover:bg-muted/5 border-border/50 transition-colors">
                  {/* 🚀 CHECKBOX INDIVIDU */}
                  <TableCell className="text-center p-6">
                    <Checkbox 
                      checked={selectedIds.includes(s.id)}
                      onCheckedChange={() => toggleSelect(s.id)}
                    />
                  </TableCell>
                  <TableCell className="font-black text-[11px] uppercase py-4">
                    {s.nama_lengkap}
                    <div className="md:hidden text-[9px] text-muted-foreground mt-0.5">NISN: {s.nisn || "-"}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center font-bold text-xs text-muted-foreground">{s.nisn || "-"}</TableCell>
                  <TableCell className="text-right p-4">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" className="rounded-xl font-black text-[9px] h-9 border-primary/20 text-primary hover:bg-primary/5">
                        <Link href={`/admin/cetak-rapor/rapor/identitas/${s.id}`} target="_blank">
                          <UserCircle className="w-3 h-3 mr-2" /> BIODATA
                        </Link>
                      </Button>
                      <Button asChild className="rounded-xl font-black text-[9px] h-9 shadow-lg shadow-primary/20">
                        <Link href={`/admin/cetak-rapor/rapor/isi/${s.id}`} target="_blank">
                          <FileText className="w-3 h-3 mr-2" /> ISI RAPOR
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 🚀 MODAL POPUP SETTING BULK */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
                <Settings2 className="w-6 h-6"/> Setting Masal
              </DialogTitle>
              <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mt-1">
                Berlaku untuk {selectedIds.length} siswa terpilih
              </p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-8 bg-white">
            {/* INPUT JUDUL */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                <Type className="w-3 h-3 text-primary"/> Judul Laporan (Manual)
              </label>
              <Input 
                value={bulkTitle}
                onChange={(e) => setBulkTitle(e.target.value.toUpperCase())}
                placeholder="CONTOH: RAPOR TENGAH SEMESTER"
                className="font-black rounded-2xl border-muted bg-muted/20 uppercase text-xs h-12 focus-visible:ring-primary"
              />
            </div>

            {/* WATERMARK */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                <ImageIcon className="w-3 h-3 text-primary"/> Watermark / Background
              </label>
              
              {!bulkBg ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-[2rem] p-8 hover:bg-muted/30 cursor-pointer transition-all">
                   <ImageIcon className="w-10 h-10 text-muted mb-2"/>
                   <span className="text-[10px] font-black text-muted-foreground uppercase">Klik untuk Upload Logo</span>
                   <input type="file" className="hidden" accept="image/*" onChange={handleUploadBg} />
                </label>
              ) : (
                <div className="space-y-6 p-6 bg-muted/20 rounded-[2rem] border border-muted/50 animate-in zoom-in-95">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-primary uppercase">Watermark Aktif</span>
                    <Button variant="ghost" size="icon" onClick={() => setBulkBg(null)} className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4"/></Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                      <span className="flex items-center gap-1"><MoveHorizontal className="w-3 h-3"/> Ukuran</span>
                      <span className="text-primary">{bulkScale}%</span>
                    </div>
                    <Slider value={[bulkScale]} max={150} min={10} onValueChange={(v) => setBulkScale(v[0])} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                      <span className="flex items-center gap-1"><Ghost className="w-3 h-3"/> Transparansi</span>
                      <span className="text-primary">{Math.round(bulkOpacity * 100)}%</span>
                    </div>
                    <Slider value={[bulkOpacity * 100]} max={100} min={0} onValueChange={(v) => setBulkOpacity(v[0]/100)} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/10 gap-3">
            <Button variant="ghost" onClick={() => setIsBulkModalOpen(false)} className="rounded-2xl font-black uppercase text-[10px]">Batal</Button>
            <Button 
              className="rounded-2xl bg-primary font-black uppercase text-[10px] px-10 h-12 shadow-xl shadow-primary/20"
              onClick={() => {
                const ids = selectedIds.join(',');
                // 🚀 REDIRECT KE HALAMAN BULK (Akan kita buat setelah ini)
                window.open(`/admin/cetak-rapor/rapor/bulk?ids=${ids}&title=${encodeURIComponent(bulkTitle)}&scale=${bulkScale}&opacity=${bulkOpacity}`, '_blank');
              }}
            >
              Proses Cetak Terpilih
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}