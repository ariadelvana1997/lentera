"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  FileText, Loader2, Star, Sparkles, 
  ClipboardCheck, Info, Save, CheckCircle2, AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

const SUBDIMENSI_MAP: Record<string, string> = {
  "keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa": "hubungan dengan tuhan yang maha esa",
  "kewargaan": "kewargaan lokal",
  "penalaran kritis": "penyampaian argumentasi",
  "kreativitas": "gagasan baru",
  "kemandirian": "bertanggung jawab",
  "kolaborasi": "kerjasama kelompok",
  "komunikasi": "penyampaian pesan",
  "kesehatan": "hidup bersih dan sehat"
}

export default function WaliKelasDeskripsiKokurikulerPage() {
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [myClass, setMyClass] = useState<any>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setFetching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: foundByWali } = await supabase.from('kelas').select('id, nama_kelas').eq('wali_id', user.id).maybeSingle()
      let finalClass = foundByWali
      
      if (!finalClass) {
        const { data: profile }: any = await supabase.from('profiles').select('kelas_id, kelas:kelas(id, nama_kelas)').eq('id', user.id).maybeSingle()
        if (profile?.kelas) finalClass = profile.kelas
      }

      if (finalClass) setMyClass(finalClass)

      const { data: proj } = await supabase.from('kegiatan_kokurikuler').select('id, judul_kegiatan')
      if (proj) setProjects(proj)
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  const generateReport = async () => {
    if (!selectedProject || !myClass) return toast.error("Pilih projek terlebih dahulu!")
    setFetching(true)
    try {
      const { data: sis } = await supabase.from('profiles').select('id, nama_lengkap').eq('kelas_id', myClass.id).filter('roles', 'cs', '{"Siswa"}').order('nama_lengkap')
      const { data: allGrades } = await supabase.from('nilai_kokurikuler').select('siswa_id, dimensi_id, nilai_huruf').eq('projek_id', selectedProject)

      const currentProjectName = projects.find(p => p.id === selectedProject)?.judul_kegiatan || "PROJEK"

      const studentReports = sis?.map(s => {
        const siswaGrades = allGrades?.filter(g => g.siswa_id === s.id) || []
        
        let deskripsi = ""
        
        if (siswaGrades.length === 0) {
          deskripsi = "Data nilai belum diinput untuk siswa ini."
        } else {
          const hasMahir = siswaGrades.some(g => g.nilai_huruf === "Mahir")
          const predikatUmum = hasMahir ? "sangat baik" : "baik"
          deskripsi = `Pada semester ini, ananda menunjukkan capaian yang ${predikatUmum} dalam penguatan profil lulusan, yang ditunjukkan melalui kegiatan kokurikuler ${currentProjectName.toUpperCase()}. `
          const rincianDimensi = siswaGrades.map(g => {
            const subName = SUBDIMENSI_MAP[g.dimensi_id] || "capaian terkait"
            return `Pada dimensi ${g.dimensi_id}, ananda ${g.nilai_huruf.toLowerCase()} dalam subdimensi ${subName}.`
          })
          deskripsi += rincianDimensi.join(" ")
        }

        return { ...s, deskripsi, hasGrades: siswaGrades.length > 0 }
      })

      if (studentReports) setStudents(studentReports)
      toast.success("Narasi rapor berhasil disusun!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setFetching(false)
    }
  }

  // 🚀 FUNGSI SIMPAN DENGAN PENGECEKAN ERROR TINGKAT TINGGI
  const handleSaveAll = async () => {
    if (students.length === 0) return toast.error("Generate narasi terlebih dahulu!")
    setSaving(true)
    try {
      const dataToSave = students
        .filter(s => s.hasGrades)
        .map(s => ({
          siswa_id: s.id,
          deskripsi: s.deskripsi
        }))

      if (dataToSave.length === 0) {
        toast.error("Tidak ada narasi valid untuk disimpan (Cek nilai siswa)");
        setSaving(false);
        return;
      }

      // Tembak ke tabel 'kokurikuler'
      const { error } = await supabase
        .from('kokurikuler')
        .upsert(dataToSave, { onConflict: 'siswa_id' })

      if (error) {
        // --- 🕵️ LOG PESAN ASLI DARI DATABASE ---
        console.error("DEBUG SAVE ERROR:", error);
        throw new Error(error.message || "Terjadi kesalahan pada database (Cek Tabel Kokurikuler)");
      }

      toast.success("Narasi rapor berhasil disimpan ke database!")
    } catch (err: any) {
      console.error(err)
      toast.error("ERROR: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (fetching && !students.length) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 uppercase ">
            <FileText className="w-8 h-8 text-primary" /> Deskripsi Rapor P5
          </h1>
          <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-3 mt-1 tracking-widest uppercase">Narasi Efektif & Rinci</Badge>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[2.5rem] p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-primary ml-1">1. Pilih Kegiatan Projek</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none font-bold ">
                <SelectValue placeholder="-- Pilih Projek --" />
              </SelectTrigger>
              <SelectContent className="rounded-xl ">
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.judul_kegiatan}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={fetching} className="h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 mr-2" /> Susun Deskripsi
            </Button>
            
            {students.length > 0 && (
              <Button onClick={handleSaveAll} disabled={saving} className="h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan ke Rapor
              </Button>
            )}
          </div>
        </div>
      </Card>

      {students.length > 0 && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[3rem] overflow-hidden">
              <div className="p-6 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ClipboardCheck className="text-primary w-5 h-5" />
                    <h3 className="text-xs font-black uppercase tracking-wider">Pratinjau Narasi</h3>
                </div>
                <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[9px]">
                    KELAS {myClass?.nama_kelas}
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 border-none text-[10px] uppercase font-black">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="w-48 text-primary">Nama Siswa</TableHead>
                    <TableHead>Narasi Lengkap Rapor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => (
                    <TableRow key={s.id} className="border-border/40 hover:bg-muted/5 transition-colors">
                      <TableCell className="text-center font-black text-muted-foreground/40">{i+1}</TableCell>
                      <TableCell className="font-black text-[11px] uppercase align-top pt-5 text-primary">{s.nama_lengkap}</TableCell>
                      <TableCell className="py-5 leading-relaxed">
                         <div className={`p-5 rounded-[1.8rem] text-[11px] font-bold border transition-all ${s.hasGrades ? "bg-background/60 border-primary/10 text-foreground/80" : "bg-red-50 text-red-500 border-red-100"}`}>
                            {s.deskripsi}
                            {s.hasGrades && <div className="mt-2 flex items-center gap-1 text-[9px] text-green-600 uppercase font-black"><CheckCircle2 className="w-3 h-3"/> Siap Simpan</div>}
                            {!s.hasGrades && <div className="mt-2 flex items-center gap-1 text-[9px] text-red-500 uppercase font-black"><AlertTriangle className="w-3 h-3"/> Nilai Kosong</div>}
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </Card>
        </div>
      )}
    </div>
  )
}