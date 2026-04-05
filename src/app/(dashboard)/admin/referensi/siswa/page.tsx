"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { registerUserAction } from "@/app/actions/register-user"
import * as XLSX from "xlsx" 
import { 
  Users, Search, UserPlus, FileDown, FileUp, 
  Loader2, Edit3, Trash2, Rocket, Trash, 
  ChevronLeft, ChevronRight, CheckCircle2,
  BookOpen, Home, UserCircle, School, Heart, ShieldCheck
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

// --- INITIAL STATE UNTUK MENCEGAH UNCONTROLLED INPUT ---
const initialFormState = {
  nama: "", email: "", password: "",
  nisn: "", nis: "", tempat_lahir: "", tanggal_lahir: "",
  jk: "Laki-laki", agama: "Islam", alamat_siswa: "", telepon_siswa: "",
  diterima_tanggal: "", diterima_di_kelas: "", asal_sekolah: "",
  status_keluarga: "", anak_ke: "1",
  nama_ayah: "", pekerjaan_ayah: "", nama_ibu: "", pekerjaan_ibu: "",
  alamat_ortu: "", telepon_ortu: "",
  nama_wali: "", pekerjaan_wali: "", alamat_wali: "", telepon_wali: "",
  no_ijasah_nasional: "", no_transkrip_nilai: "", tanggal_lulus: ""
}

export default function ReferensiSiswaPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [formData, setFormData] = useState<any>(initialFormState)

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, data_siswa(*)')
        .contains('roles', ['Siswa'])
        .order('nama_lengkap', { ascending: true })
      if (data) setStudents(data)
    } finally { setFetching(false) }
  }

  // --- LOGIKA FILTER & PAGINATION ---
  const filteredData = students.filter(s => 
    s.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.data_siswa?.nisn?.includes(searchQuery)
  )
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSelectAll = () => {
    if (selectedIds.length === currentData.length) setSelectedIds([])
    else setSelectedIds(currentData.map(s => s.id))
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleOpenAdd = () => {
    setIsEditMode(false)
    setSelectedStudent(null)
    setFormData(initialFormState)
    setIsDialogOpen(true)
  }

  const handleEditClick = (student: any) => {
    setIsEditMode(true)
    setSelectedStudent(student)
    const ds = student.data_siswa || {}
    setFormData({
      nama: student.nama_lengkap ?? "",
      email: student.email ?? "",
      password: "",
      nisn: ds.nisn ?? "",
      nis: ds.nis ?? "",
      tempat_lahir: ds.tempat_lahir ?? "",
      tanggal_lahir: ds.tanggal_lahir ?? "",
      jk: ds.jk ?? "Laki-laki",
      agama: ds.agama ?? "Islam",
      alamat_siswa: ds.alamat_siswa ?? "",
      telepon_siswa: ds.telepon_siswa ?? "",
      diterima_tanggal: ds.diterima_tanggal ?? "",
      diterima_di_kelas: ds.diterima_di_kelas ?? "",
      asal_sekolah: ds.asal_sekolah ?? "",
      status_keluarga: ds.status_keluarga ?? "",
      anak_ke: ds.anak_ke ?? "1",
      nama_ayah: ds.nama_ayah ?? "",
      pekerjaan_ayah: ds.pekerjaan_ayah ?? "",
      nama_ibu: ds.nama_ibu ?? "",
      pekerjaan_ibu: ds.pekerjaan_ibu ?? "",
      alamat_ortu: ds.alamat_ortu ?? "",
      telepon_ortu: ds.telepon_ortu ?? "",
      nama_wali: ds.nama_wali ?? "",
      pekerjaan_wali: ds.pekerjaan_wali ?? "",
      alamat_wali: ds.alamat_wali ?? "",
      telepon_wali: ds.telepon_wali ?? "",
      no_ijasah_nasional: ds.no_ijasah_nasional ?? "",
      no_transkrip_nilai: ds.no_transkrip_nilai ?? "",
      tanggal_lulus: ds.tanggal_lulus ?? ""
    })
    setIsDialogOpen(true)
  }

  const downloadTemplate = () => {
    const headers = [
      "Nama Lengkap", "Email", "Password", "NISN", "NIS", "Tempat Lahir", "Tanggal Lahir",
      "JK", "Agama", "Alamat Siswa", "Telepon Siswa", "Diterima Tanggal", "Diterima di Kelas", 
      "Asal Sekolah", "Status Keluarga", "Anak Ke", "Nama Ayah", "Pekerjaan Ayah", 
      "Nama Ibu", "Pekerjaan Ibu", "Alamat Ortu", "Telepon Ortu"
    ]
    const ws = XLSX.utils.aoa_to_sheet([headers])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")
    XLSX.writeFile(wb, "Template_Siswa_LENTERA.xlsx")
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary" })
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[]
        alert(`Memproses ${data.length} data. Ini akan memakan waktu...`)
        for (const row of data) {
          const res = await registerUserAction({
            nama: row["Nama Lengkap"], email: row["Email"], 
            password: row["Password"] || "123456", roles: ["Siswa"]
          })
          if (res.success) {
            await supabase.from('data_siswa').upsert({
              id: (res as any).data.id, nisn: row["NISN"], nis: row["NIS"],
              jk: row["JK"], tempat_lahir: row["Tempat Lahir"], tanggal_lahir: row["Tanggal Lahir"]
            })
          }
        }
        alert("✅ Import Berhasil!")
        fetchStudents()
      } catch (err) { alert("❌ Gagal!") }
      finally { setLoading(false) }
    }
    reader.readAsBinaryString(file)
  }

  const handleDeleteBulk = async () => {
    if (confirm(`Hapus ${selectedIds.length} data?`)) {
      setLoading(true)
      await supabase.from('profiles').delete().in('id', selectedIds)
      setSelectedIds([])
      fetchStudents()
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let studentId = selectedStudent?.id
      if (!isEditMode) {
        const res = await registerUserAction({
          nama: formData.nama, email: formData.email, 
          password: formData.password, roles: ["Siswa"]
        })
        if (!res.success) throw new Error(res.message)
        studentId = (res as any).data.id
      } else {
        await supabase.from('profiles').update({ nama_lengkap: formData.nama }).eq('id', studentId)
      }

      // DESTRECTURING UNTUK FIX SCHEMA CACHE ERROR
      const { nama, email, password, ...biodataHanyaSiswa } = formData;

      const { error } = await supabase.from('data_siswa').upsert({
        id: studentId,
        ...biodataHanyaSiswa,
        updated_at: new Date()
      })
      if (error) throw error

      alert("✅ Tersimpan!")
      setIsDialogOpen(false)
      fetchStudents()
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Referensi Siswa
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">Total {students.length} Siswa</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <Button onClick={handleDeleteBulk} variant="destructive" className="rounded-xl font-bold">
              <Trash className="w-4 h-4 mr-2" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={downloadTemplate} className="rounded-xl font-bold border-dashed text-primary">
            <FileDown className="w-4 h-4 mr-2" /> Template
          </Button>
          <div className="relative">
            <Button variant="outline" className="rounded-xl font-bold overflow-hidden">
              <FileUp className="w-4 h-4 mr-2" /> Import Excel
              <input type="file" onChange={handleImportExcel} className="absolute inset-0 opacity-0 cursor-pointer" accept=".xlsx" />
            </Button>
          </div>
          <Button onClick={handleOpenAdd} className="rounded-xl font-bold shadow-lg">
            <UserPlus className="w-4 h-4 mr-2" /> Tambah Siswa
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Nama/NISN..." 
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
              <TableHead className="font-black text-[10px] uppercase">Nama Siswa</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Identitas</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">Status</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : currentData.map((s) => (
              <TableRow key={s.id} className={`hover:bg-muted/5 transition-colors border-border/50 ${selectedIds.includes(s.id) ? "bg-primary/5" : ""}`}>
                <TableCell className="p-6 text-center"><Checkbox checked={selectedIds.includes(s.id)} onCheckedChange={() => handleSelectOne(s.id)} /></TableCell>
                <TableCell className="font-bold text-sm">{s.nama_lengkap}</TableCell>
                <TableCell className="text-xs font-medium text-muted-foreground">NISN: {s.data_siswa?.nisn || "-"} <br/> NIS: {s.data_siswa?.nis || "-"}</TableCell>
                <TableCell className="text-center">
<Badge variant="secondary">LENGKAP</Badge>
                </TableCell>
                <TableCell className="text-right p-6 flex justify-end gap-1">
                  <Button onClick={() => window.open(`/siswa?autopilot=${s.id}`, "_blank")} variant="ghost" size="icon" className="rounded-xl text-amber-600"><Rocket className="w-4 h-4 fill-current"/></Button>
                  <Button onClick={() => handleEditClick(s)} variant="ghost" size="icon" className="rounded-xl text-primary"><Edit3 className="w-4 h-4"/></Button>
                  <Button onClick={() => handleDeleteBulk()} variant="ghost" size="icon" className="rounded-xl text-red-500"><Trash2 className="w-4 h-4"/></Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 rounded-[2.5rem] border-none shadow-2xl overflow-hidden focus-visible:outline-none">
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-black">Biodata Lengkap Siswa</DialogTitle>
              <DialogDescription>Pastikan data sinkron dengan Dapodik atau dokumen resmi.</DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 px-8 pb-8">
              <div className="space-y-10 pb-10">
                {/* 1. AKUN */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><UserCircle className="w-4 h-4"/> Akun & Akses</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Nama Lengkap</Label><Input value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11" required/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11" required disabled={isEditMode}/></div>
                    {!isEditMode && <div className="space-y-1 col-span-2"><Label className="text-[10px] uppercase font-bold ml-1">Password</Label><Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11" required/></div>}
                  </div>
                </div>

                {/* 2. IDENTITAS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><Home className="w-4 h-4"/> Identitas Siswa</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">NISN</Label><Input value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">NIS</Label><Input value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold ml-1">JK</Label>
                      <Select value={formData.jk} onValueChange={v => setFormData({...formData, jk: v})}>
                        <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="Laki-laki">Laki-laki</SelectItem><SelectItem value="Perempuan">Perempuan</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Tempat Lahir</Label><Input value={formData.tempat_lahir} onChange={e => setFormData({...formData, tempat_lahir: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Tgl Lahir</Label><Input type="date" value={formData.tanggal_lahir} onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Agama</Label><Input value={formData.agama} onChange={e => setFormData({...formData, agama: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Alamat Lengkap</Label><Input value={formData.alamat_siswa} onChange={e => setFormData({...formData, alamat_siswa: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Telepon Siswa</Label><Input value={formData.telepon_siswa} onChange={e => setFormData({...formData, telepon_siswa: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                  </div>
                </div>

                {/* 3. PENDIDIKAN */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><School className="w-4 h-4"/> Pendidikan & Status</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1 col-span-2"><Label className="text-[10px] uppercase font-bold ml-1">Asal Sekolah</Label><Input value={formData.asal_sekolah} onChange={e => setFormData({...formData, asal_sekolah: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Diterima Tgl</Label><Input type="date" value={formData.diterima_tanggal} onChange={e => setFormData({...formData, diterima_tanggal: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Kelas</Label><Input value={formData.diterima_di_kelas} onChange={e => setFormData({...formData, diterima_di_kelas: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1 col-span-2"><Label className="text-[10px] uppercase font-bold ml-1">Status Keluarga</Label><Input value={formData.status_keluarga} onChange={e => setFormData({...formData, status_keluarga: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11" placeholder="Anak Kandung/Tiri"/></div>
                    <div className="space-y-1 col-span-2"><Label className="text-[10px] uppercase font-bold ml-1">Anak Ke</Label><Input type="number" value={formData.anak_ke} onChange={e => setFormData({...formData, anak_ke: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                  </div>
                </div>

                {/* 4. ORANG TUA */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><Heart className="w-4 h-4"/> Data Orang Tua</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4 p-4 rounded-3xl bg-muted/20">
                       <Label className="text-[10px] font-black text-primary uppercase">Ayah</Label>
                       <Input placeholder="Nama Ayah" value={formData.nama_ayah} onChange={e => setFormData({...formData, nama_ayah: e.target.value})} className="rounded-xl border-none bg-background/50 h-11"/>
                       <Input placeholder="Pekerjaan Ayah" value={formData.pekerjaan_ayah} onChange={e => setFormData({...formData, pekerjaan_ayah: e.target.value})} className="rounded-xl border-none bg-background/50 h-11"/>
                    </div>
                    <div className="space-y-4 p-4 rounded-3xl bg-muted/20">
                       <Label className="text-[10px] font-black text-primary uppercase">Ibu</Label>
                       <Input placeholder="Nama Ibu" value={formData.nama_ibu} onChange={e => setFormData({...formData, nama_ibu: e.target.value})} className="rounded-xl border-none bg-background/50 h-11"/>
                       <Input placeholder="Pekerjaan Ibu" value={formData.pekerjaan_ibu} onChange={e => setFormData({...formData, pekerjaan_ibu: e.target.value})} className="rounded-xl border-none bg-background/50 h-11"/>
                    </div>
                    <div className="space-y-1 col-span-2"><Label className="text-[10px] uppercase font-bold ml-1">Alamat Orang Tua</Label><Input value={formData.alamat_ortu} onChange={e => setFormData({...formData, alamat_ortu: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1 col-span-2"><Label className="text-[10px] uppercase font-bold ml-1">Telepon Ortu</Label><Input value={formData.telepon_ortu} onChange={e => setFormData({...formData, telepon_ortu: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                  </div>
                </div>

                {/* 5. WALI */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><ShieldCheck className="w-4 h-4"/> Data Wali</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Nama Wali</Label><Input value={formData.nama_wali} onChange={e => setFormData({...formData, nama_wali: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Pekerjaan Wali</Label><Input value={formData.pekerjaan_wali} onChange={e => setFormData({...formData, pekerjaan_wali: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1 col-span-2"><Label className="text-[10px] uppercase font-bold ml-1">Alamat Wali</Label><Input value={formData.alamat_wali} onChange={e => setFormData({...formData, alamat_wali: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1 col-span-2"><Label className="text-[10px] uppercase font-bold ml-1">Telepon Wali</Label><Input value={formData.telepon_wali} onChange={e => setFormData({...formData, telepon_wali: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                  </div>
                </div>

                {/* 6. KELULUSAN */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><BookOpen className="w-4 h-4"/> Kelulusan</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Ijazah Nasional</Label><Input value={formData.no_ijasah_nasional} onChange={e => setFormData({...formData, no_ijasah_nasional: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Transkrip</Label><Input value={formData.no_transkrip_nilai} onChange={e => setFormData({...formData, no_transkrip_nilai: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Tgl Lulus</Label><Input type="date" value={formData.tanggal_lulus} onChange={e => setFormData({...formData, tanggal_lulus: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11"/></div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-8 bg-muted/20 border-t flex-shrink-0">
              <Button type="submit" className="w-full h-12 rounded-xl font-black text-sm shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIMPAN BIODATA LENGKAP"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}