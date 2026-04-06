"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ChevronLeft, Loader2, Save, User, 
  BookOpen, Target, Award, Info, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"

export default function InputNilaiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: pengampuId } = use(params)
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [pengampuInfo, setPengampuInfo] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [gradesData, setGradesData] = useState<Record<string, any>>({})

  useEffect(() => {
    loadData()
  }, [pengampuId])

  const loadData = async () => {
    setFetching(true)
    try {
      // 1. Ambil Info Mapel Pengampu
      const { data: pengampu } = await supabase
        .from('mapel_pengampu')
        .select(`
          *,
          mapel:mata_pelajaran(nama_mapel),
          kelas:kelas(id, nama_kelas)
        `)
        .eq('id', pengampuId)
        .single()
      
      setPengampuInfo(pengampu)

      if (pengampu) {
        // 2. Ambil Daftar Siswa
        const { data: siswa } = await supabase
          .from('profiles')
          .select('id, nama_lengkap')
          .eq('kelas_id', pengampu.kelas?.id)
          .filter('roles', 'cs', '{"Siswa"}')
          .order('nama_lengkap')

        // 3. Ambil Nilai yang sudah tersimpan di database
        const { data: existingGrades } = await supabase
          .from('nilai_akademik')
          .select('*')
          .eq('pengampu_id', pengampuId)

        // 4. Mapping data ke state lokal
        const map: Record<string, any> = {}
        siswa?.forEach(s => {
          const found = existingGrades?.find(g => g.siswa_id === s.id)
          map[s.id] = {
            nilai_angka: found?.nilai_angka || 0,
            capaian_kompetensi: found?.capaian_kompetensi || ""
          }
        })

        setStudents(siswa || [])
        setGradesData(map)
      }
    } catch (err: any) {
      toast.error("Gagal load data: " + err.message)
    } finally {
      setFetching(false)
    }
  }

  // --- FUNGSI AUTO NARASI ---
  const handleInputChange = (siswaId: string, field: string, value: any) => {
    let updatedVal = value
    let autoNarasi = gradesData[siswaId]?.capaian_kompetensi || ""

    if (field === 'nilai_angka') {
      updatedVal = parseInt(value) || 0
      const mapel = pengampuInfo?.mapel?.nama_mapel || "Mata Pelajaran"
      const kktp = pengampuInfo?.kktp || 75

      // Logika Narasi Otomatis
      if (updatedVal >= 90) {
        autoNarasi = `Menunjukkan penguasaan yang sangat baik dalam memahami materi ${mapel} dan mampu menyelesaikannya dengan sangat tepat.`
      } else if (updatedVal >= kktp) {
        autoNarasi = `Menunjukkan penguasaan yang baik dalam kompetensi materi ${mapel}, sudah mencapai kriteria ketuntasan.`
      } else if (updatedVal > 0) {
        autoNarasi = `Perlu bimbingan dan latihan lebih intensif dalam memahami konsep dasar ${mapel} agar mencapai ketuntasan.`
      }
    }

    setGradesData(prev => ({
      ...prev,
      [siswaId]: { 
        ...prev[siswaId], 
        [field]: updatedVal,
        capaian_kompetensi: field === 'nilai_angka' ? autoNarasi : updatedVal 
      }
    }))
  }

  // --- FUNGSI SIMPAN KE DATABASE (UPSERT) ---
  const handleSave = async () => {
  setLoading(true)
  try {
    const payload = students.map(s => ({
  pengampu_id: pengampuId,
  siswa_id: s.id,
  nilai_angka: parseInt(gradesData[s.id]?.nilai_angka) || 0,
  capaian_kompetensi: gradesData[s.id]?.capaian_kompetensi || "" // <--- Pastikan tulisannya begini
}))

    const { error } = await supabase
      .from('nilai_akademik')
      .upsert(payload, { onConflict: 'pengampu_id,siswa_id' })

    if (error) {
      // PERBAIKAN: Log error.message agar tidak muncul {}
      console.error("Detail Error Supabase:", error.message);
      throw new Error(error.message);
    }
    
    toast.success("✅ Nilai Berhasil Disimpan!");
  } catch (err: any) {
    // Tampilkan pesan error yang manusiawi
    toast.error("Gagal menyimpan: " + (err.message || "Terjadi kesalahan sistem"));
    console.error("Save error full object:", err);
  } finally {
    setLoading(false)
  }
}

  if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-border/50">
            <Link href="/admin/penilaian/input"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none ">Entry Nilai {pengampuInfo?.mapel?.nama_mapel}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-2">Kelas {pengampuInfo?.kelas?.nama_kelas}</Badge>
              <Badge className="bg-green-500/10 text-green-600 border-none font-black text-[9px] uppercase px-2">KKTP: {pengampuInfo?.kktp || 75}</Badge>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="rounded-xl font-black h-11 px-8 shadow-lg shadow-primary/20 transition-all active:scale-95">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
          SIMPAN NILAI SEKARANG
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-6 text-center font-black text-[10px] uppercase text-muted-foreground">No</TableHead>
              <TableHead className="w-64 font-black text-[10px] uppercase text-primary">Identitas Siswa</TableHead>
              <TableHead className="w-32 text-center font-black text-[10px] uppercase text-muted-foreground">Nilai Angka</TableHead>
              <TableHead className="font-black text-[10px] uppercase p-6 text-muted-foreground">Capaian Kompetensi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((siswa, index) => {
              const currentNilai = gradesData[siswa.id]?.nilai_angka || 0;
              const isUnderKKTP = currentNilai < (pengampuInfo?.kktp || 75) && currentNilai > 0;

              return (
                <TableRow key={siswa.id} className="hover:bg-muted/5 border-border/50 transition-colors">
                  <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="py-4">
                    <span className="font-black text-[11px] uppercase tracking-tight">{siswa.nama_lengkap}</span>
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      className={`text-center font-black border-none shadow-inner rounded-xl h-11 text-sm transition-all ${isUnderKKTP ? "bg-red-50 text-red-600 ring-1 ring-red-200" : "bg-white"}`}
                      value={gradesData[siswa.id]?.nilai_angka}
                      onChange={(e) => handleInputChange(siswa.id, 'nilai_angka', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="relative group">
                      <Textarea 
                        value={gradesData[siswa.id]?.capaian_kompetensi}
                        onChange={(e) => handleInputChange(siswa.id, 'capaian_kompetensi', e.target.value)}
                        placeholder="Narasi otomatis..."
                        className="min-h-[80px] rounded-2xl border-none bg-muted/20 text-[11px] font-medium leading-relaxed resize-none focus:bg-white transition-all p-4"
                      />
                      <Sparkles className="absolute right-3 top-3 w-3 h-3 text-primary/30" />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}