"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { registerUserAction } from "@/app/actions/register-user"
import * as XLSX from "xlsx" 
import { 
  Users, Search, UserPlus, FileDown, FileUp, 
  Loader2, Edit3, Trash2, Rocket, Trash, 
  ChevronLeft, ChevronRight, CheckCircle2,
  BookOpen, Home, UserCircle, School, Heart, ShieldCheck,
  RefreshCw 
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

  // --- STATE PROGRES IMPORT ---
  const [importProgress, setImportProgress] = useState(0)
  const [showImportProgress, setShowImportProgress] = useState(false)
  const [importStatus, setImportStatus] = useState({ success: 0, fail: 0, total: 0 })

  // --- HELPER: FORMAT VALUE (Mencegah Error Syntax Date "X" atau "") ---
  const formatValue = (val: any, isDate: boolean = false) => {
    if (val === undefined || val === null || val === "" || val === "-" || val === "X" || val === "x") {
      return null;
    }

    const stringVal = val.toString().trim();

    // Jika ini kolom tanggal, validasi apakah formatnya bisa diterima database
    if (isDate) {
      const timestamp = Date.parse(stringVal);
      if (isNaN(timestamp)) {
        return null; // Balikkan null jika isinya teks sampah seperti "X"
      }
    }

    return stringVal;
  };

  const generateInstitutionalEmail = () => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
    return `${randomDigits}@lentera.app`;
  };

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, data_siswa(*)')
        .filter('roles', 'cs', '{"Siswa"}') 
        .order('nama_lengkap', { ascending: true })

      if (error) console.error("Kesalahan Fetch:", error.message)
      if (data) setStudents(data)
    } finally { setFetching(false) }
  }

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
    setFormData({
      ...initialFormState,
      email: generateInstitutionalEmail(),
      password: "SiswaLentera123" 
    })
    setIsDialogOpen(true)
  }

  const handleEditClick = (student: any) => {
    setIsEditMode(true)
    setSelectedStudent(student)
    const ds = student.data_siswa || {}
    
    const sanitizedData: any = { ...initialFormState }
    sanitizedData.nama = student.nama_lengkap || ""
    sanitizedData.email = student.email || ""
    
    Object.keys(initialFormState).forEach(key => {
      if (key !== 'nama' && key !== 'email' && key !== 'password') {
        sanitizedData[key] = ds[key] || ""
      }
    })
    
    setFormData(sanitizedData)
    setIsDialogOpen(true)
  }

  const downloadTemplate = () => {
    const headers = [[
      "Nama Lengkap", "Email", "Password", "NISN", "NIS", "Jenis Kelamin", 
      "Tempat Lahir", "Tanggal Lahir", "Agama", "Alamat Siswa", "Telepon Siswa",
      "Asal Sekolah", "Diterima Tanggal", "Diterima di Kelas", "Status Keluarga", "Anak Ke",
      "Nama Ayah", "Pekerjaan Ayah", "Nama Ibu", "Pekerjaan Ibu", "Alamat Ortu", "Telepon Ortu",
      "Nama Wali", "Pekerjaan Wali", "Alamat Wali", "Telepon Wali",
      "No Ijasah Nasional", "No Transkrip Nilai", "Tanggal Lulus"
    ]];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Siswa_LENTERA.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setShowImportProgress(true);
    setImportProgress(0);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
        
        const total = data.length;
        let successCount = 0;
        let failCount = 0;
        setImportStatus({ success: 0, fail: 0, total });

        for (let i = 0; i < total; i++) {
          const row = data[i];
          const email = row["Email"] || generateInstitutionalEmail();
          const pass = row["Password"]?.toString() || "SiswaLentera123";

          // 1. DAFTARKAN AKUN (Profiles)
          const res: any = await registerUserAction({
            nama: row["Nama Lengkap"], email, password: pass, roles: ["Siswa"]
          });

          const sid = res.user?.id || res.data?.id || res.id;

          if (res.success && sid) {
            // 2. SIMPAN BIODATA (data_siswa) - Dengan validasi tanggal cerdas
            const { error: bioError } = await supabase.from('data_siswa').upsert({
              id: sid,
              nisn: formatValue(row["NISN"]),
              nis: formatValue(row["NIS"]),
              jk: formatValue(row["Jenis Kelamin"]),
              tempat_lahir: formatValue(row["Tempat Lahir"]),
              tanggal_lahir: formatValue(row["Tanggal Lahir"], true), // isDate: true
              agama: formatValue(row["Agama"]),
              alamat_siswa: formatValue(row["Alamat Siswa"]),
              telepon_siswa: formatValue(row["Telepon Siswa"]),
              asal_sekolah: formatValue(row["Asal Sekolah"]),
              diterima_tanggal: formatValue(row["Diterima Tanggal"], true), // isDate: true
              diterima_di_kelas: formatValue(row["Diterima di Kelas"]),
              status_keluarga: formatValue(row["Status Keluarga"]),
              anak_ke: formatValue(row["Anak Ke"]),
              nama_ayah: formatValue(row["Nama Ayah"]),
              pekerjaan_ayah: formatValue(row["Pekerjaan Ayah"]),
              nama_ibu: formatValue(row["Nama Ibu"]),
              pekerjaan_ibu: formatValue(row["Pekerjaan Ibu"]),
              alamat_ortu: formatValue(row["Alamat Ortu"]),
              telepon_ortu: formatValue(row["Telepon Ortu"]),
              nama_wali: formatValue(row["Nama Wali"]),
              pekerjaan_wali: formatValue(row["Pekerjaan Wali"]),
              alamat_wali: formatValue(row["Alamat Wali"]),
              telepon_wali: formatValue(row["Telepon Wali"]),
              no_ijasah_nasional: formatValue(row["No Ijasah Nasional"]),
              no_transkrip_nilai: formatValue(row["No Transkrip Nilai"]),
              tanggal_lulus: formatValue(row["Tanggal Lulus"], true), // isDate: true
              updated_at: new Date()
            });

            if (bioError) {
              console.error(`Gagal Biodata ${row["Nama Lengkap"]}:`, bioError.message);
              failCount++;
            } else {
              successCount++;
            }
          } else {
            failCount++;
          }

          setImportProgress(Math.round(((i + 1) / total) * 100));
          setImportStatus(prev => ({ ...prev, success: successCount, fail: failCount }));
        }
        
        setTimeout(() => { 
          setShowImportProgress(false); 
          fetchStudents(); 
        }, 1500);

      } catch (err) { 
        alert("Error reading file"); 
        setShowImportProgress(false); 
      } finally { 
        setLoading(false); 
        e.target.value = ""; 
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteBulk = async () => {
    if (confirm(`Hapus ${selectedIds.length} data?`)) {
      setLoading(true)
      await supabase.from('profiles').delete().in('id', selectedIds)
      setSelectedIds([]); fetchStudents(); setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let studentId = selectedStudent?.id
      if (!isEditMode) {
        const res: any = await registerUserAction({
          nama: formData.nama, email: formData.email, password: formData.password, roles: ["Siswa"]
        })
        if (!res.success) throw new Error(res.message)
        studentId = res.user?.id || res.data?.id || res.id;
      } else {
        await supabase.from('profiles').update({ nama_lengkap: formData.nama }).eq('id', studentId)
      }

      const { nama, email, password, ...biodata } = formData;
      const cleanData: any = {};
      Object.keys(biodata).forEach(k => {
        const isDateField = k.includes('tanggal') || k.includes('lulus');
        cleanData[k] = formatValue(biodata[k], isDateField);
      });

      const { error } = await supabase.from('data_siswa').upsert({
        id: studentId, ...cleanData, updated_at: new Date()
      })
      if (error) throw error
      setIsDialogOpen(false); fetchStudents(); alert("✅ Berhasil!")
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
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1 ">Pusat Data Induk Peserta Didik</p>
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
            <Button variant="outline" className="rounded-xl font-bold overflow-hidden bg-white/50 shadow-sm">
              <FileUp className="w-4 h-4 mr-2" /> Import Excel
              <input type="file" onChange={handleImportExcel} className="absolute inset-0 opacity-0 cursor-pointer" accept=".xlsx" />
            </Button>
          </div>
          <Button onClick={handleOpenAdd} className="rounded-xl font-black shadow-lg shadow-primary/20">
            <UserPlus className="w-4 h-4 mr-2" /> Tambah Siswa
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input 
              placeholder="Cari Nama/NISN..." 
              className="pl-12 rounded-2xl h-11 bg-muted/30 border-none font-bold text-xs"
              value={searchQuery || ""}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none font-bold ">Halaman {currentPage} / {totalPages || 1}</span>
        </div>

        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-6">
                <Checkbox checked={selectedIds.length === currentData.length && currentData.length > 0} onCheckedChange={handleSelectAll} />
              </TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Nama Lengkap Siswa</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Identitas Nasional</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Status Data</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest p-6 text-muted-foreground">Opsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : currentData.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-40 text-center font-bold text-muted-foreground uppercase text-[10px] tracking-widest ">Tidak ada data siswa ditemukan.</TableCell></TableRow>
            ) : currentData.map((s) => (
              <TableRow key={s.id} className={`hover:bg-muted/5 transition-colors border-border/50 ${selectedIds.includes(s.id) ? "bg-primary/5" : ""}`}>
                <TableCell className="p-6 text-center"><Checkbox checked={selectedIds.includes(s.id)} onCheckedChange={() => handleSelectOne(s.id)} /></TableCell>
                <TableCell className="font-black text-[11px] uppercase text-primary ">{s.nama_lengkap}</TableCell>
                <TableCell className="text-[10px] font-bold text-muted-foreground tracking-tight">NISN: {s.data_siswa?.nisn || "-"} <br/> NIS: {s.data_siswa?.nis || "-"}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none font-black text-[9px] uppercase ">TERVALIDASI</Badge>
                </TableCell>
                <TableCell className="text-right p-6 flex justify-end gap-1">
                  <Button onClick={() => window.open(`/siswa?autopilot=${s.id}`, "_blank")} variant="ghost" size="icon" className="rounded-xl text-amber-600 hover:bg-amber-50" title="Login Sebagai Siswa"><Rocket className="w-4 h-4 fill-current"/></Button>
                  <Button onClick={() => handleEditClick(s)} variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/5"><Edit3 className="w-4 h-4"/></Button>
                  <Button onClick={() => handleDeleteBulk()} variant="ghost" size="icon" className="rounded-xl text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
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
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest font-bold">Total {filteredData.length} Records</span>
        </div>
      </Card>

      {/* DIALOG FORM BIODATA LENGKAP */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 rounded-[2.5rem] border-none shadow-2xl overflow-hidden focus-visible:outline-none bg-white/95 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter ">Biodata Lengkap Peserta Didik</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none mt-1">Lengkapi data untuk keperluan buku induk & rapor semester.</DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 px-8 pb-8">
              <div className="space-y-10 pb-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><UserCircle className="w-4 h-4"/> Akses Sistem & Login</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Nama Lengkap</Label><Input value={formData.nama || ""} onChange={e => setFormData({...formData, nama: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-black text-xs" required/></div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold ml-1 flex justify-between">Email Institusi</Label>
                      <Input type="email" value={formData.email || ""} readOnly={!isEditMode} className={`rounded-xl border-none h-11 font-mono text-xs ${!isEditMode ? 'bg-primary/5 text-primary font-black' : 'bg-muted/40'}`} required disabled={isEditMode}/>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><Home className="w-4 h-4"/> Detail Identitas Siswa</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">NISN</Label><Input value={formData.nisn || ""} onChange={e => setFormData({...formData, nisn: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">NIS</Label><Input value={formData.nis || ""} onChange={e => setFormData({...formData, nis: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"/></div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold ml-1">Jenis Kelamin</Label>
                      <Select value={formData.jk || "Laki-laki"} onValueChange={v => setFormData({...formData, jk: v})}>
                        <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="Laki-laki">Laki-laki</SelectItem><SelectItem value="Perempuan">Perempuan</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Tempat Lahir</Label><Input value={formData.tempat_lahir || ""} onChange={e => setFormData({...formData, tempat_lahir: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Tgl Lahir</Label><Input type="date" value={formData.tanggal_lahir || ""} onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Agama</Label><Input value={formData.agama || ""} onChange={e => setFormData({...formData, agama: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"/></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><School className="w-4 h-4"/> Riwayat Pendidikan</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Asal Sekolah</Label><Input value={formData.asal_sekolah || ""} onChange={e => setFormData({...formData, asal_sekolah: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold ml-1">Kelas Awal</Label><Input value={formData.diterima_di_kelas || ""} onChange={e => setFormData({...formData, diterima_di_kelas: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-black text-xs uppercase"/></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><Heart className="w-4 h-4"/> Data Orang Tua Siswa</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4 p-4 rounded-3xl bg-muted/20 border border-border/50">
                       <Label className="text-[9px] font-black text-primary uppercase ">Informasi Ayah</Label>
                       <Input placeholder="Nama Ayah" value={formData.nama_ayah || ""} onChange={e => setFormData({...formData, nama_ayah: e.target.value})} className="rounded-xl border-none bg-white h-11 font-bold text-xs"/>
                       <Input placeholder="Pekerjaan Ayah" value={formData.pekerjaan_ayah || ""} onChange={e => setFormData({...formData, pekerjaan_ayah: e.target.value})} className="rounded-xl border-none bg-white h-11 font-bold text-xs"/>
                    </div>
                    <div className="space-y-4 p-4 rounded-3xl bg-muted/20 border border-border/50">
                       <Label className="text-[9px] font-black text-primary uppercase ">Informasi Ibu</Label>
                       <Input placeholder="Nama Ibu" value={formData.nama_ibu || ""} onChange={e => setFormData({...formData, nama_ibu: e.target.value})} className="rounded-xl border-none bg-white h-11 font-bold text-xs"/>
                       <Input placeholder="Pekerjaan Ibu" value={formData.pekerjaan_ibu || ""} onChange={e => setFormData({...formData, pekerjaan_ibu: e.target.value})} className="rounded-xl border-none bg-white h-11 font-bold text-xs"/>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-8 bg-muted/20 border-t flex-shrink-0">
              <Button type="submit" className="w-full h-12 rounded-xl font-black text-xs shadow-lg shadow-primary/20 uppercase tracking-widest" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "SIMPAN PERUBAHAN DATA SISWA"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL PROGRES IMPORT */}
      <Dialog open={showImportProgress} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8 border-none shadow-2xl bg-white/95 backdrop-blur-md focus-visible:outline-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Progres Import Siswa</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * importProgress) / 100} className="text-primary transition-all duration-500 ease-out" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xl ">{importProgress}%</div>
            </div>

            <div className="space-y-1">
              <h3 className="font-black uppercase text-lg tracking-tighter">Mengimpor Data LENTERA...</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Sistem sedang mendaftarkan akun & biodata</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full pt-4">
              <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20">
                <p className="text-[9px] font-black text-green-600 uppercase mb-1">Berhasil</p>
                <p className="text-xl font-black leading-none">{importStatus.success}</p>
              </div>
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-[9px] font-black text-red-600 uppercase mb-1">Gagal</p>
                <p className="text-xl font-black leading-none">{importStatus.fail}</p>
              </div>
            </div>
            
            <div className="w-full bg-muted/30 h-1.5 rounded-full overflow-hidden">
               <div className="bg-primary h-full transition-all duration-500" style={{ width: `${importProgress}%` }} />
            </div>
            
            <p className="text-[10px] font-bold text-muted-foreground uppercase font-black tracking-tight ">
               {importStatus.success + importStatus.fail} / {importStatus.total} Peserta Didik
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}