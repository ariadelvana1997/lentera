"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ChevronLeft, Loader2, Save, User, 
  CheckCircle2, AlertCircle, Info, BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import Link from "next/link"
import { toast } from "sonner"

export default function DetailInputNilaiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: pengampuId } = use(params)
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [info, setInfo] = useState<any>(null)
  const [tpList, setTpList] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<Record<string, any>>({})

  useEffect(() => {
    loadInitialData()
  }, [pengampuId])

  const loadInitialData = async () => {
    setFetching(true)
    try {
      // 1. Ambil Data Pengampu & Info Kelas
      const { data: pengampu, error: errPengampu } = await supabase
        .from('mapel_pengampu')
        .select(`*, kelas:kelas(id, nama_kelas)`)
        .eq('id', pengampuId)
        .single()
      
      if (errPengampu) throw errPengampu
      setInfo(pengampu)

      // 2. Ambil Daftar TP (Tujuan Pembelajaran)
      const { data: tps } = await supabase
        .from('tujuan_pembelajaran')
        .select('*')
        .eq('pengampu_id', pengampuId)
      setTpList(tps || [])

      if (pengampu?.kelas?.id) {
        // 3. Ambil Siswa di Kelas tersebut
        // Menggunakan filter yang lebih fleksibel untuk kolom roles
        const { data: siswa, error: errSiswa } = await supabase
          .from('profiles')
          .select('id, nama_lengkap, roles, kelas_id')
          .eq('kelas_id', pengampu.kelas.id)

        if (errSiswa) {
          console.error("DEBUG Error Siswa:", errSiswa.message);
          toast.error("Gagal memuat siswa: " + errSiswa.message);
          return;
        }

        // Filter manual untuk role 'Siswa' agar anti-error tipe data
        const filteredSiswa = siswa?.filter((s: any) => {
          const r = Array.isArray(s.roles) ? s.roles.join(' ') : String(s.roles);
          return r.toLowerCase().includes('siswa');
        }) || [];

        // 4. Ambil Nilai yang sudah tersimpan
        const { data: existingGrades } = await supabase
          .from('nilai_akademik')
          .select('*')
          .eq('pengampu_id', pengampuId)

        const gradeMap: Record<string, any> = {}
        filteredSiswa.forEach(s => {
          const found = existingGrades?.find(g => g.siswa_id === s.id)
          gradeMap[s.id] = {
            nilai: found?.nilai_akhir !== undefined ? found.nilai_akhir.toString() : "",
            keterangan: found?.capaian_tertinggi || "" 
          }
        })

        setStudents(filteredSiswa)
        setGrades(gradeMap)
      }
    } catch (err: any) {
      console.error("System Error:", err.message);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setFetching(false)
    }
  }

  // --- LOGIKA OTOMATISASI KETERANGAN ---
  const handleNilaiChange = (siswaId: string, val: string) => {
    const nilaiNum = parseInt(val)
    let autoKet = grades[siswaId]?.keterangan || ""

    if (!isNaN(nilaiNum) && tpList.length > 0) {
      const gabunganTP = tpList.map(tp => tp.deskripsi_tp).join(", ")
      const kktp = info?.kktp || 75

      if (nilaiNum >= kktp) {
        autoKet = `Menunjukkan penguasaan yang baik dalam ${gabunganTP}`
      } else {
        autoKet = `Perlu ditingkatkan dalam ${gabunganTP}`
      }
    } else if (val === "") {
      autoKet = ""
    }

    setGrades(prev => ({
      ...prev,
      [siswaId]: { nilai: val, keterangan: autoKet }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload = Object.entries(grades)
        .filter(([_, data]) => data.nilai !== "")
        .map(([siswaId, data]) => ({
          pengampu_id: pengampuId,
          siswa_id: siswaId,
          nilai_akhir: parseInt(data.nilai) || 0,
          capaian_tertinggi: data.keterangan 
        }))

      if (payload.length === 0) return toast.error("Tidak ada nilai untuk disimpan")

      const { error } = await supabase
        .from('nilai_akademik')
        .upsert(payload, { onConflict: 'pengampu_id,siswa_id' })

      if (error) throw error
      toast.success("Berhasil!", { description: "Semua nilai berhasil disimpan." })
    } catch (err: any) {
      toast.error("Gagal simpan!", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-muted">
            <Link href="/admin/penilaian/input"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase leading-none">{info?.mapel?.nama_mapel}</h1>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              Kelas {info?.kelas?.nama_kelas} <span className="opacity-30">|</span> KKTP: <span className="text-primary">{info?.kktp}</span>
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="rounded-xl font-black h-11 px-8 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
          SIMPAN SEMUA NILAI
        </Button>
      </div>

      {tpList.length === 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200 border-dashed rounded-2xl flex items-center gap-3 text-amber-700 animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-[10px] font-black uppercase leading-relaxed">
            Perhatian: Belum ada Tujuan Pembelajaran (TP) terdaftar. Deskripsi narasi otomatis tidak akan berfungsi.
          </p>
        </Card>
      )}

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-6 text-center font-black text-[10px] uppercase">No</TableHead>
              <TableHead className="w-64 font-black text-[10px] uppercase">Siswa</TableHead>
              <TableHead className="w-32 text-center font-black text-[10px] uppercase">Nilai</TableHead>
              <TableHead className="font-black text-[10px] uppercase p-6">Capaian Kompetensi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
               <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground italic font-bold">Tidak ada siswa ditemukan di kelas ini.</TableCell></TableRow>
            ) : students.map((siswa, index) => (
              <TableRow key={siswa.id} className="hover:bg-muted/5 border-border/50 transition-colors">
                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="py-4">
                   <div className="flex items-center gap-3">
                     <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><User className="w-5 h-5"/></div>
                     <span className="font-black text-[11px] uppercase tracking-tight">{siswa.nama_lengkap}</span>
                   </div>
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={grades[siswa.id]?.nilai}
                    onChange={(e) => handleNilaiChange(siswa.id, e.target.value)}
                    className="h-12 rounded-xl border-none bg-white shadow-inner font-black text-center text-lg focus:ring-2 focus:ring-primary/40 transition-all"
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="p-6">
                  <Textarea 
                    value={grades[siswa.id]?.keterangan}
                    onChange={(e) => setGrades(prev => ({...prev, [siswa.id]: { ...prev[siswa.id], keterangan: e.target.value }}))}
                    className="min-h-[90px] rounded-2xl border-none bg-muted/20 text-[11px] font-medium leading-relaxed resize-none focus:bg-white focus:shadow-md transition-all p-4"
                    placeholder="Narasi otomatis muncul di sini..."
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}