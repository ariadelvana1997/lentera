"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { registerUserAction } from "@/app/actions/register-user"
import * as XLSX from "xlsx" 
import { 
  Users, Search, UserPlus, FileUp, Download,
  Loader2, Edit3, Trash2, Trash, 
  ChevronLeft, ChevronRight,
  UserCircle, Heart, MapPin, FileText, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
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
import Link from "next/link"
import { toast } from "sonner"

const initialFormState = {
  nama: "", email: "", password: "",
  nisn: "", nis: "", tempat_lahir: "", tanggal_lahir: "",
  jk: "Laki-laki", agama: "Islam", alamat_siswa: "", 
  nama_ayah: "", pekerjaan_ayah: "", nama_ibu: "", pekerjaan_ibu: "",
  nama_wali: "", pekerjaan_wali: ""
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
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatValue = (val: any, isDate: boolean = false) => {
    if (val === undefined || val === null || val === "" || val === "-" || val === "X") return null;
    if (isDate && isNaN(Date.parse(val))) return null;
    return val.toString().trim();
  };

  const generateInstitutionalEmail = () => {
    return `${Math.floor(10000 + Math.random() * 90000)}@lentera.app`;
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
      if (data) setStudents(data)
    } finally { setFetching(false) }
  }

  // --- 🚀 GACOR: LOGIKA EXCEL (TEMPLATE & IMPORT) ---
  const handleDownloadTemplate = () => {
    const templateData = [{
      "Nama": "CONTOH NAMA SISWA SULTAN",
      "NIS": "12345",
      "NISN": "0012345678",
      "TempatLahir": "TASIKMALAYA",
      "TanggalLahir": "2010-01-01",
      "JK": "Laki-laki",
      "Agama": "Islam",
      "Alamat": "JL. LENTERA NO. 7",
      "Ayah": "NAMA AYAH",
      "PekerjaanAyah": "WIRAUSAHA",
      "Ibu": "NAMA IBU",
      "PekerjaanIbu": "GURU",
      "Wali": "-",
      "PekerjaanWali": "-"
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Siswa");
    XLSX.writeFile(wb, "Template_Import_Siswa_Lentera.xlsx");
    toast.success("Template Excel berhasil diunduh!");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setLoading(true);
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const excelRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        let success = 0;
        toast.loading(`Memproses ${excelRows.length} data siswa...`);

        for (const row of excelRows) {
          try {
            // Helper Case Insensitive
            const getVal = (keys: string[]) => {
              const k = Object.keys(row).find(x => keys.includes(x.toLowerCase().trim()));
              return k ? row[k] : null;
            };

            const res: any = await registerUserAction({
              nama: (getVal(["nama", "nama siswa"]) || "TANPA NAMA").toString().toUpperCase(),
              email: generateInstitutionalEmail(),
              password: "SiswaLentera123",
              roles: ["Siswa"]
            });

            if (res.success) {
              const studentId = res.user?.id || res.id;
              await supabase.from('data_siswa').upsert({
                id: studentId,
                nisn: formatValue(getVal(["nisn"])),
                nis: formatValue(getVal(["nis"])),
                tempat_lahir: getVal(["tempatlahir", "tempat lahir"]),
                tanggal_lahir: formatValue(getVal(["tanggallahir", "tanggal lahir"]), true),
                jk: getVal(["jk", "jenis kelamin"]) || "Laki-laki",
                agama: getVal(["agama"]) || "Islam",
                alamat_siswa: getVal(["alamat"]),
                nama_ayah: getVal(["ayah", "nama ayah"]),
                pekerjaan_ayah: getVal(["pekerjaanayah", "pekerjaan ayah"]),
                nama_ibu: getVal(["ibu", "nama ibu"]),
                pekerjaan_ibu: getVal(["pekerjaanibu", "pekerjaan ibu"]),
                nama_wali: getVal(["wali"]),
                pekerjaan_wali: getVal(["pekerjaanwali"])
              });
              success++;
            }
          } catch (err) {}
        }
        toast.dismiss();
        toast.success(`${success} Siswa Berhasil Diimport!`);
        fetchStudents();
      } catch (err) {
        toast.error("File rusak atau tidak sesuai format.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- CRUD FUNCTIONS ---
  const filteredData = students.filter(s => 
    s.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.data_siswa?.nisn?.includes(searchQuery) ||
    s.data_siswa?.nis?.includes(searchQuery)
  )
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSelectAll = () => {
    if (selectedIds.length === currentData.length && currentData.length > 0) setSelectedIds([])
    else setSelectedIds(currentData.map(s => s.id))
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleDeleteOne = async (id: string, nama: string) => {
    if (!confirm(`Hapus data siswa ${nama}?`)) return
    setLoading(true)
    try {
      await supabase.from('profiles').delete().eq('id', id)
      toast.success(`Berhasil menghapus ${nama}`)
      fetchStudents()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const handleOpenAdd = () => {
    setIsEditMode(false)
    setSelectedStudent(null)
    setFormData({ ...initialFormState, email: generateInstitutionalEmail(), password: "SiswaLentera123" })
    setIsDialogOpen(true)
  }

  const handleEditClick = (student: any) => {
    setIsEditMode(true)
    setSelectedStudent(student)
    const ds = student.data_siswa || {}
    setFormData({
      nama: student.nama_lengkap || "",
      email: student.email || "",
      password: "", 
      ...ds
    })
    setIsDialogOpen(true)
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
        studentId = res.user?.id || res.id;
      } else {
        await supabase.from('profiles').update({ nama_lengkap: formData.nama }).eq('id', studentId)
      }

      const { nama, email, password, ...biodata } = formData;
      const cleanData: any = {};
      Object.keys(biodata).forEach(k => {
        cleanData[k] = formatValue(biodata[k], k === 'tanggal_lahir');
      });

      await supabase.from('data_siswa').upsert({ id: studentId, ...cleanData, updated_at: new Date() })
      setIsDialogOpen(false); fetchStudents(); toast.success("✅ Sinkronisasi Berhasil!")
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 ">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 uppercase text-primary">
            <Users className="w-8 h-8" /> Referensi Siswa
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">
             Total {filteredData.length} Records Terdeteksi
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleDownloadTemplate} variant="ghost" className="rounded-2xl font-black gap-2 text-primary uppercase text-[10px] h-12 px-6">
            <Download className="w-4 h-4" /> Template Excel
          </Button>
          
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline" 
            className="rounded-2xl font-black gap-2 border-green-600 text-green-600 hover:bg-green-50 uppercase text-[10px] h-12 px-8"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            Import Excel
          </Button>

          <Button onClick={handleOpenAdd} className="rounded-2xl font-black shadow-xl shadow-primary/20 uppercase text-[10px] h-12 px-8 bg-primary text-white">
            <UserPlus className="w-4 h-4 mr-2" /> Tambah Siswa Baru
          </Button>
        </div>
      </div>

      {/* SEARCH */}
      <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm rounded-[2rem] p-6">
         <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50 transition-all" />
            <Input 
              placeholder="Cari berdasarkan nama, nis, atau nisn sultan..." 
              className="pl-14 rounded-2xl h-14 bg-white border-none font-bold text-sm shadow-inner"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
         </div>
      </Card>

      {/* TABLE SECTION - WITH SCROLL MODE */}
      <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        {/* GACOR: SCROLL AREA SETTINGS */}
        <ScrollArea className="h-[600px] w-full">
          <Table>
            <TableHeader className="bg-muted/10 sticky top-0 z-20 backdrop-blur-md">
              <TableRow className="border-none">
                <TableHead className="w-12 p-6">
                  <Checkbox checked={selectedIds.length === currentData.length && currentData.length > 0} onCheckedChange={handleSelectAll} className="border-primary/30" />
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase p-6 text-primary">Data Identitas Utama</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-muted-foreground">Nomor Induk / NISN</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-muted-foreground">Kelahiran & Alamat</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase p-6 text-muted-foreground">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetching ? (
                <TableRow><TableCell colSpan={5} className="h-60 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : currentData.length === 0 ? (
                 <TableRow><TableCell colSpan={5} className="h-60 text-center font-black uppercase text-[10px] opacity-30 ">Tidak ada siswa sultan ditemukan.</TableCell></TableRow>
              ) : currentData.map((s) => (
                <TableRow key={s.id} className={`hover:bg-primary/5 transition-all border-border/40 ${selectedIds.includes(s.id) ? "bg-primary/5" : ""}`}>
                  <TableCell className="p-6 text-center">
                     <Checkbox checked={selectedIds.includes(s.id)} onCheckedChange={() => handleSelectOne(s.id)} className="border-primary/30" />
                  </TableCell>
                  <TableCell className="py-6">
                     <div className="flex flex-col">
                        <span className="font-black text-[11px] uppercase text-primary leading-none ">{s.nama_lengkap}</span>
                        <span className="text-[8px] font-bold text-muted-foreground mt-1.5 uppercase tracking-widest">{s.email}</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold ">
                     {s.data_siswa?.nis || "--"} / {s.data_siswa?.nisn || "--"}
                  </TableCell>
                  <TableCell className="text-[9px] font-bold text-muted-foreground uppercase">
                     {s.data_siswa?.tempat_lahir || "-"}, {s.data_siswa?.tanggal_lahir || "-"} <br/>
                     <span className="opacity-50 flex items-center gap-1 mt-1"><MapPin className="w-2.5 h-2.5"/> {s.data_siswa?.alamat_siswa?.substring(0, 30) || "Alamat belum diset"}...</span>
                  </TableCell>
                  <TableCell className="text-right p-6">
                     <div className="flex justify-end gap-2">
                        <Button onClick={() => handleEditClick(s)} variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/5"><Edit3 className="w-4 h-4"/></Button>
                        <Button asChild variant="ghost" size="icon" className="rounded-xl text-amber-600 hover:bg-amber-50" title="Cetak Identitas">
                          <Link href={`/admin/cetak-rapor/rapor/identitas/${s.id}`}><FileText className="w-4 h-4"/></Link>
                        </Button>
                        <Button onClick={() => handleDeleteOne(s.id, s.nama_lengkap)} variant="ghost" size="icon" className="rounded-xl text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
                     </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* PAGINATION */}
        <div className="p-8 border-t border-border/50 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" className="rounded-xl font-black uppercase text-[9px] h-9 px-4" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="w-4 h-4 mr-1"/> Prev</Button>
             <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all ${currentPage === i + 1 ? "bg-primary text-white shadow-lg" : "text-primary hover:bg-primary/10"}`}>{i + 1}</button>
                ))}
             </div>
             <Button variant="outline" size="sm" className="rounded-xl font-black uppercase text-[9px] h-9 px-4" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>Next <ChevronRight className="w-4 h-4 ml-1"/></Button>
          </div>
          <span className="text-[10px] font-black uppercase text-primary/40 tracking-[0.4em]">LENTERA • High Fidelity Database</span>
        </div>
      </Card>

      {/* DIALOG FORM */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[850px] max-h-[90vh] p-0 rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-10 pb-4 bg-primary/5">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {isEditMode ? "Perbarui Identitas Sultan" : "Daftarkan Siswa Sultan Baru"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Lengkapi 10 Poin Utama Identitas Rapor & Buku Induk</DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 px-10 pb-10">
              <div className="space-y-10 py-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><UserCircle className="w-4 h-4"/> 1. Informasi Dasar & Kelahiran</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[9px] uppercase font-black ml-1">Nama Lengkap</Label><Input value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value.toUpperCase()})} className="rounded-xl border-none bg-muted/40 h-11 font-black text-xs" required/></div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><Label className="text-[9px] uppercase font-black ml-1">NIS</Label><Input value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"/></div>
                        <div className="space-y-1"><Label className="text-[9px] uppercase font-black ml-1">NISN</Label><Input value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><Label className="text-[9px] uppercase font-black ml-1">Tempat Lahir</Label><Input value={formData.tempat_lahir} onChange={e => setFormData({...formData, tempat_lahir: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"/></div>
                        <div className="space-y-1"><Label className="text-[9px] uppercase font-black ml-1">Tgl Lahir</Label><Input type="date" value={formData.tanggal_lahir} onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-bold text-xs"/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase font-black ml-1">Jenis Kelamin</Label>
                          <Select value={formData.jk} onValueChange={v => setFormData({...formData, jk: v})}>
                            <SelectTrigger className="rounded-xl border-none bg-muted/40 h-11 font-black text-xs"><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="Laki-laki">Laki-laki</SelectItem><SelectItem value="Perempuan">Perempuan</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1"><Label className="text-[9px] uppercase font-black ml-1">Agama</Label><Input value={formData.agama} onChange={e => setFormData({...formData, agama: e.target.value})} className="rounded-xl border-none bg-muted/40 h-11 font-black text-xs"/></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><MapPin className="w-4 h-4"/> 6. Alamat Tempat Tinggal</div>
                    <Textarea value={formData.alamat_siswa} onChange={e => setFormData({...formData, alamat_siswa: e.target.value})} className="rounded-2xl border-none bg-muted/40 min-h-[80px] p-4 text-xs font-bold " placeholder="Tuliskan alamat lengkap siswa..."/>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><Heart className="w-4 h-4"/> 7-10. Orang Tua & Wali</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-5 rounded-3xl border-none bg-primary/5 space-y-4">
                       <Badge className="bg-primary/10 text-primary border-none uppercase text-[8px] font-black ">Identitas Ayah</Badge>
                       <div className="space-y-1"><Label className="text-[9px] uppercase font-black ml-1">Nama Ayah</Label><Input value={formData.nama_ayah} onChange={e => setFormData({...formData, nama_ayah: e.target.value})} className="rounded-xl border-none bg-white h-10 font-bold text-xs shadow-sm"/></div>
                       <div className="space-y-1"><Label className="text-[9px] uppercase font-black ml-1">Pekerjaan Ayah</Label><Input value={formData.pekerjaan_ayah} onChange={e => setFormData({...formData, pekerjaan_ayah: e.target.value})} className="rounded-xl border-none bg-white h-10 font-bold text-xs shadow-sm"/></div>
                    </Card>
                    <Card className="p-5 rounded-3xl border-none bg-pink-500/5 space-y-4">
                       <Badge className="bg-pink-500/10 text-pink-600 border-none uppercase text-[8px] font-black ">Identitas Ibu</Badge>
                       <div className="space-y-1"><Label className="text-[9px] uppercase font-black ml-1">Nama Ibu</Label><Input value={formData.nama_ibu} onChange={e => setFormData({...formData, nama_ibu: e.target.value})} className="rounded-xl border-none bg-white h-10 font-bold text-xs shadow-sm"/></div>
                       <div className="space-y-1"><Label className="text-[9px] uppercase font-black ml-1">Pekerjaan Ibu</Label><Input value={formData.pekerjaan_ibu} onChange={e => setFormData({...formData, pekerjaan_ibu: e.target.value})} className="rounded-xl border-none bg-white h-10 font-bold text-xs shadow-sm"/></div>
                    </Card>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-10 bg-primary/5 border-t">
              <Button type="submit" className="w-full h-14 rounded-2xl font-black text-xs shadow-2xl shadow-primary/20 uppercase tracking-widest" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "SIMPAN MASTER DATA IDENTITAS"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}