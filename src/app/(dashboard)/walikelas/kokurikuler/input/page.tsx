"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Zap, Loader2, ChevronRight, 
  Star, ArrowLeft, Save, Sparkles, Info,
  MousePointerClick
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

// --- DAFTAR DIMENSI PROFIL LULUSAN ---
const DAFTAR_DIMENSI = [
  "keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa",
  "kewargaan",
  "penalaran kritis",
  "kreativitas",
  "kemandirian",
  "kolaborasi",
  "komunikasi",
  "kesehatan"
]

export default function WaliKelasInputKokurikulerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Data Lists
  const [projects, setProjects] = useState<any[]>([])
  const [myClass, setMyClass] = useState<any>(null) 
  const [students, setStudents] = useState<any[]>([])

  // Selection State
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedDimension, setSelectedDimension] = useState("") 
  
  // Grade State
  const [grades, setGrades] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setFetching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // --- LOGIKA DETEKTIF PAMUNGKAS (KELAS PERWALIAN) ---
      let finalClass: any = null

      const { data: foundByWali } = await supabase
        .from('kelas')
        .select('id, nama_kelas')
        .eq('wali_id', user.id)
        .maybeSingle()
      
      finalClass = foundByWali

      if (!finalClass) {
        const { data: profile }: any = await supabase
          .from('profiles')
          .select('kelas_id, kelas:kelas(id, nama_kelas)')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.kelas) finalClass = profile.kelas
      }

      if (!finalClass) {
        const { data: guruData }: any = await supabase
          .from('data_guru')
          .select('kelas_id, kelas:kelas(id, nama_kelas)')
          .eq('email', user.email)
          .maybeSingle()
        if (guruData?.kelas) finalClass = guruData.kelas
      }

      if (finalClass) {
        setMyClass(finalClass)
      }

      // --- AMBIL KEGIATAN PROJEK ---
      const { data: proj } = await supabase
        .from('kegiatan_kokurikuler')
        .select('id, judul_kegiatan')
        .order('created_at', { ascending: false })
      
      if (proj) setProjects(proj)

    } catch (err: any) {
      console.error("Fetch Error:", err.message)
    } finally {
      setFetching(false)
    }
  }

  const handleStartInput = async () => {
    if (!myClass || !selectedProject || !selectedDimension) {
        return toast.error("Lengkapi pilihan Kelas, Kegiatan, dan Dimensi!")
    }

    setLoading(true)
    try {
      // 1. Ambil Siswa
      const { data: sis } = await supabase
        .from('profiles')
        .select('id, nama_lengkap')
        .eq('kelas_id', myClass.id)
        .filter('roles', 'cs', '{"Siswa"}')
        .order('nama_lengkap')

      // 2. TARIK DATA LAMA DARI DATABASE (AGAR TIDAK HILANG SAAT REFRESH)
      const { data: existingGrades } = await supabase
        .from('nilai_kokurikuler')
        .select('siswa_id, nilai_huruf')
        .eq('projek_id', selectedProject)
        .eq('dimensi_id', selectedDimension)
        .in('siswa_id', sis?.map(s => s.id) || [])

      const gradeMap: Record<string, any> = {}
      existingGrades?.forEach(g => {
        gradeMap[`${g.siswa_id}-${selectedDimension}`] = g.nilai_huruf
      })
      setGrades(gradeMap)

      if (sis) setStudents(sis || [])
      setStep(2)
      
      if (existingGrades && existingGrades.length > 0) {
          toast.info(`Berhasil memuat ${existingGrades.length} data nilai tersimpan.`)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGradeChange = (siswaId: string, dimId: string, value: string) => {
    setGrades(prev => ({ ...prev, [`${siswaId}-${dimId}`]: value }))
  }

  // --- FITUR TERAPKAN KE SEMUA SISWA ---
  const applyToAll = (val: string) => {
    const newGrades = { ...grades }
    students.forEach(siswa => {
      newGrades[`${siswa.id}-${selectedDimension}`] = val
    })
    setGrades(newGrades)
    toast.success(`Nilai "${val}" diterapkan sementara ke semua siswa. Klik "Simpan Nilai" untuk mempermanenkan!`)
  }

 const handleSave = async () => {
    if (Object.keys(grades).length === 0) return toast.error("Belum ada nilai untuk disimpan!")
    
    setLoading(true)
    try {
      const payload = Object.entries(grades)
        .filter(([_, val]) => val !== "" && val !== null)
        .map(([key, value]) => {
          // Kita pisahkan key "siswaId-namaDimensi" secara hati-hati
          const lastDashIndex = key.lastIndexOf('-')
          const siswaId = key.substring(0, lastDashIndex)
          
          return {
            siswa_id: siswaId,
            projek_id: selectedProject,
            dimensi_id: selectedDimension, // Ini sekarang dikirim sebagai teks
            nilai_huruf: value,
            updated_at: new Date().toISOString()
          }
        })

      console.log("Payload Siap Orbit:", payload)

      const { error } = await supabase
        .from('nilai_kokurikuler')
        .upsert(payload, { 
          onConflict: 'siswa_id,projek_id,dimensi_id' 
        })

      if (error) throw error
      
      toast.success(`✅ Berhasil! ${payload.length} Nilai tersimpan permanen.`)
    } catch (err: any) {
      console.error("Detail Error:", err)
      // Jika masih error UUID, berarti kolom di DB memang belum diubah ke TEXT
      toast.error("Gagal Simpan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 uppercase">
            <Zap className="w-8 h-8 text-primary" /> Penilaian P5
          </h1>
          <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-3 mt-1 tracking-widest uppercase">Sinkronisasi Kokurikuler</Badge>
        </div>
        {step === 2 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl font-black border-primary/20 text-primary uppercase text-[10px] h-11 px-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </Button>
            <Button onClick={handleSave} disabled={loading} className="rounded-xl font-black shadow-lg shadow-primary/20 uppercase text-[10px] px-8 h-11">
              {loading ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan Nilai
            </Button>
          </div>
        )}
      </div>

      {step === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
          <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[3rem] p-10 space-y-8 overflow-visible relative">
            <div className="space-y-6">
               <div className="grid gap-3">
                  <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">1. Kelompok Perwalian Anda</Label>
                  <div className={`h-14 rounded-2xl flex items-center px-6 font-black text-primary border shadow-inner transition-all duration-500 ${myClass ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-transparent animate-pulse"}`}>
                    {myClass ? `KELAS ${myClass.nama_kelas}` : "Menghubungkan..."}
                  </div>
               </div>

               <div className="grid gap-3 relative z-50">
                  <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">2. Pilih Judul Kegiatan Projek</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="h-14 w-full rounded-2xl border-none bg-muted/60 font-bold shadow-inner text-left px-6 cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted/80">
                      <SelectValue placeholder="-- Klik Untuk Pilih Judul Kegiatan --" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl z-[100] border-border/50 shadow-2xl bg-card">
                      <ScrollArea className="h-64">
                        {projects.map(p => (
                          <SelectItem key={p.id} value={p.id} className="font-black uppercase text-[11px] py-4 cursor-pointer focus:bg-primary/10 transition-colors border-b border-border/10 last:border-none">
                            {p.judul_kegiatan}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
               </div>

               <div className="grid gap-3 relative z-40">
                  <Label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">3. Pilih Dimensi Profil Lulusan</Label>
                  <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                    <SelectTrigger className="h-14 w-full rounded-2xl border-none bg-muted/60 font-bold shadow-inner text-left px-6 cursor-pointer hover:bg-muted/80 transition-all">
                      <SelectValue placeholder="-- Klik Untuk Pilih Dimensi --" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl z-[100] border-border/50 shadow-2xl bg-card">
                      <ScrollArea className="h-72">
                        {DAFTAR_DIMENSI.map((dim) => (
                          <SelectItem key={dim} value={dim} className="font-black uppercase text-[10px] py-4 cursor-pointer focus:bg-primary/10 border-b border-border/10 last:border-none leading-tight">
                            {dim}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
               </div>
            </div>

            <Button 
              onClick={handleStartInput} 
              disabled={loading || !myClass || !selectedProject || !selectedDimension} 
              className="w-full h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                <span className="flex items-center gap-2">MULAI INPUT NILAI <ChevronRight className="w-5 h-5" /></span>
              )}
            </Button>
          </Card>

          <div className="hidden md:flex flex-col justify-center p-12 border-2 border-dashed border-primary/20 rounded-[3rem] space-y-4 text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto opacity-20" />
            <h3 className="font-black uppercase text-sm tracking-widest opacity-40">Info Kokurikuler</h3>
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase">Gunakan tombol "Terapkan ke Semua" di langkah berikutnya untuk mengisi nilai masal dengan cepat.</p>
          </div>
        </div>
      ) : (
        <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[3.5rem] overflow-hidden animate-in zoom-in-95">
          <div className="p-8 border-b border-border/50 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"><Star className="w-6 h-6" /></div>
                <div>
                   <h3 className="font-black uppercase text-sm leading-none ">{projects.find(p => p.id === selectedProject)?.judul_kegiatan}</h3>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 ">KELAS {myClass?.nama_kelas} • {students.length} PESERTA DIDIK</p>
                </div>
             </div>

             {/* PANEL TERAPKAN NILAI MASSAL */}
             <div className="flex flex-col gap-2 bg-background/50 p-4 rounded-[1.8rem] border border-primary/10 shadow-inner">
                <div className="flex items-center gap-2 mb-1 px-1">
                   <MousePointerClick className="w-3 h-3 text-primary" />
                   <span className="text-[9px] font-black uppercase text-primary tracking-tighter">Terapkan Ke Semua Siswa</span>
                </div>
                <div className="flex gap-2">
                   {["Berkembang", "Cakap", "Mahir"].map((val) => (
                      <Button 
                        key={val} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyToAll(val)}
                        className={`h-9 px-4 rounded-xl text-[9px] font-black uppercase transition-all ${
                          val === "Berkembang" ? "hover:bg-orange-500 hover:text-white border-orange-200" :
                          val === "Cakap" ? "hover:bg-blue-500 hover:text-white border-blue-200" :
                          "hover:bg-emerald-500 hover:text-white border-emerald-200"
                        }`}
                      >
                        {val}
                      </Button>
                   ))}
                </div>
             </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-none">
                  <TableHead className="w-12 p-8 text-center font-black text-[10px] uppercase ">No</TableHead>
                  <TableHead className="w-64 font-black text-[10px] uppercase text-primary ">Nama Siswa</TableHead>
                  <TableHead className="text-center font-black text-[9px] uppercase leading-tight min-w-[200px]">Penilaian Capaian: <br/> <span className="text-primary  opacity-70">{selectedDimension}</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((siswa, index) => (
                  <TableRow key={siswa.id} className="hover:bg-muted/5 border-border/40 transition-colors">
                    <TableCell className="text-center font-black text-muted-foreground/40 ">{index + 1}</TableCell>
                    <TableCell className="py-6"><span className="font-black text-[11px] uppercase tracking-tight ">{siswa.nama_lengkap}</span></TableCell>
                    <TableCell className="p-3">
                      <div className="max-w-[200px] mx-auto">
                        <Select value={grades[`${siswa.id}-${selectedDimension}`] || ""} onValueChange={(val) => handleGradeChange(siswa.id, selectedDimension, val)}>
                          <SelectTrigger className="h-12 rounded-xl border-none bg-background/60 font-black text-[10px] shadow-inner uppercase ">
                            <SelectValue placeholder="-- PILIH NILAI --" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl ">
                            <SelectItem value="Berkembang" className="font-bold text-orange-500 uppercase">Berkembang</SelectItem>
                            <SelectItem value="Cakap" className="font-bold text-blue-500 uppercase">Cakap</SelectItem>
                            <SelectItem value="Mahir" className="font-bold text-emerald-600 uppercase">Mahir</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-8 bg-muted/20 border-t border-border/50 flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" /> <span className="text-[9px] font-black uppercase opacity-60">Berkembang</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" /> <span className="text-[9px] font-black uppercase opacity-60">Cakap</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> <span className="text-[9px] font-black uppercase opacity-60">Mahir</span>
             </div>
          </div>
        </Card>
      )}
    </div>
  )
}