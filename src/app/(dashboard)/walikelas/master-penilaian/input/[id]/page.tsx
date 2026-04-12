"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ChevronLeft, Loader2, Save, User, 
  BookOpen, Sparkles, AlertCircle, Target, ListChecks
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

export default function WaliKelasInputNilaiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: pengampuId } = use(params)
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [pengampuInfo, setPengampuInfo] = useState<any>(null)
  const [tpList, setTpList] = useState<any[]>([]) // State untuk menampung TP dari referensi
  const [students, setStudents] = useState<any[]>([])
  const [gradesData, setGradesData] = useState<Record<string, any>>({})
  const [isAuthorized, setIsAuthorized] = useState(true)

  useEffect(() => {
    loadData()
  }, [pengampuId])

 const loadData = async () => {
    setFetching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Ambil info pengampu
      const { data: pengampu } = await supabase
        .from('mapel_pengampu')
        .select(`
          *,
          mapel:mata_pelajaran(nama_mapel),
          kelas:kelas(id, nama_kelas)
        `)
        .eq('id', pengampuId)
        .eq('guru_id', user.id)
        .single()
      
      if (!pengampu) {
        setIsAuthorized(false)
        setFetching(false)
        return
      }
      setPengampuInfo(pengampu)

      // 2. AMBIL TUJUAN PEMBELAJARAN (Sesuai Screenshot: Pakai pengampu_id)
      const { data: tps } = await supabase
        .from('tujuan_pembelajaran')
        .select('deskripsi_tp')
        .eq('pengampu_id', pengampuId) // <--- Kita ganti filternya ke sini

      setTpList(tps || [])

      // 3. Ambil data siswa & nilai (tetap sama)
      const { data: siswa } = await supabase
        .from('profiles')
        .select('id, nama_lengkap')
        .eq('kelas_id', pengampu.kelas?.id)
        .filter('roles', 'cs', '{"Siswa"}')
        .order('nama_lengkap')

      const { data: existingGrades } = await supabase
        .from('nilai_akademik')
        .select('*')
        .eq('pengampu_id', pengampuId)

      const map: Record<string, any> = {}
      siswa?.forEach(s => {
        const found = existingGrades?.find(g => g.siswa_id === s.id)
        map[s.id] = {
          nilai_angka: (found?.nilai_angka !== null && found?.nilai_angka !== undefined) ? found.nilai_angka : "",
          capaian_kompetensi: found?.capaian_kompetensi || ""
        }
      })

      setStudents(siswa || [])
      setGradesData(map)
    } catch (err: any) {
      toast.error("Gagal load data: " + err.message)
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (siswaId: string, field: string, value: any) => {
    let updatedVal = value
    let autoNarasi = gradesData[siswaId]?.capaian_kompetensi || ""

    if (field === 'nilai_angka') {
      if (value === "") {
        updatedVal = ""
        autoNarasi = ""
      } else {
        updatedVal = parseInt(value) || 0
        const kktp = pengampuInfo?.kktp || 75
        
        // --- LOGIKA PENYATUAN TP ---
        // Jika ada TP di list, gabungkan. Jika tidak, pakai info pengampu atau fallback.
        const tpReferensi = tpList.length > 0 
          ? tpList.map(t => t.deskripsi_tp).join(" serta ")
          : (pengampuInfo?.tujuan_pembelajaran || "kompetensi yang ditetapkan")

        if (updatedVal >= 90) {
          autoNarasi = `Menunjukkan penguasaan yang sangat baik dalam ${tpReferensi}.`
        } else if (updatedVal >= kktp) {
          autoNarasi = `Menunjukkan penguasaan yang baik dalam ${tpReferensi}.`
        } else if (updatedVal > 0) {
          autoNarasi = `Perlu bimbingan dan latihan lebih intensif dalam ${tpReferensi} agar mencapai ketuntasan.`
        }
      }
    }

    setGradesData(prev => ({
      ...prev,
      [siswaId]: { 
        ...prev[siswaId], 
        [field]: updatedVal,
        capaian_kompetensi: field === 'nilai_angka' ? autoNarasi : (field === 'capaian_kompetensi' ? value : prev[siswaId].capaian_kompetensi)
      }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload = students.map(s => ({
        pengampu_id: pengampuId,
        siswa_id: s.id,
        nilai_angka: gradesData[s.id]?.nilai_angka === "" ? 0 : parseInt(gradesData[s.id]?.nilai_angka),
        capaian_kompetensi: gradesData[s.id]?.capaian_kompetensi || ""
      }))

      const { error } = await supabase
        .from('nilai_akademik')
        .upsert(payload, { onConflict: 'pengampu_id,siswa_id' })

      if (error) throw new Error(error.message)
      toast.success("✅ Nilai & Deskripsi TP Berhasil Disimpan!");
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  if (!isAuthorized) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
      <AlertCircle className="w-16 h-16 text-red-500 opacity-20" />
      <h2 className="text-xl font-black uppercase ">Akses Ditolak</h2>
      <p className="text-muted-foreground text-sm font-bold uppercase tracking-tighter">Anda tidak terdaftar sebagai pengampu di jadwal ini.</p>
      <Button asChild variant="outline" className="rounded-xl font-black uppercase text-[10px] tracking-widest ">
        <Link href="/walikelas/master-penilaian/input">Kembali ke Daftar</Link>
      </Button>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 ">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-border/50 h-11 w-11">
            <Link href="/walikelas/master-penilaian/input"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none ">
              Input Nilai {pengampuInfo?.mapel?.nama_mapel}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-3 ">Kelas {pengampuInfo?.kelas?.nama_kelas}</Badge>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] uppercase px-3 ">KKTP: {pengampuInfo?.kktp || 75}</Badge>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="rounded-2xl font-black h-12 px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase text-[11px]  tracking-widest">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
          SIMPAN NILAI & NARASI
        </Button>
      </div>

      {/* INFO TUJUAN PEMBELAJARAN (TP) DARI REFERENSI */}
      <Card className="border-none shadow-xl bg-primary/5 p-6 rounded-[2rem] flex items-start gap-4 border-l-4 border-l-primary">
          <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
             <ListChecks className="w-5 h-5" />
          </div>
          <div>
             <p className="text-[9px] font-black uppercase text-primary/60 tracking-widest">Tujuan Pembelajaran (Referensi):</p>
             <div className="mt-1 space-y-1">
                {tpList.length > 0 ? tpList.map((t, i) => (
                  <p key={i} className="text-xs font-black uppercase leading-tight text-primary">
                    • {t.deskripsi_tp}
                  </p>
                )) : (
                  <p className="text-xs font-black uppercase leading-tight text-red-500 ">
                    ⚠️ Belum ada TP di Referensi Mapel. Segera hubungi Admin.
                  </p>
                )}
             </div>
          </div>
      </Card>

      <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[3rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-8 text-center font-black text-[10px] uppercase text-muted-foreground ">No</TableHead>
              <TableHead className="w-64 font-black text-[10px] uppercase text-primary ">Peserta Didik</TableHead>
              <TableHead className="w-32 text-center font-black text-[10px] uppercase text-muted-foreground ">Nilai</TableHead>
              <TableHead className="font-black text-[10px] uppercase p-6 text-muted-foreground ">Deskripsi Capaian Kompetensi (Berdasarkan TP)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="p-20 text-center font-black text-muted-foreground uppercase text-xs  opacity-30">Tidak ada siswa ditemukan.</TableCell></TableRow>
            ) : (
              students.map((siswa, index) => {
                const currentNilai = gradesData[siswa.id]?.nilai_angka;
                const isUnderKKTP = currentNilai !== "" && currentNilai < (pengampuInfo?.kktp || 75) && currentNilai > 0;

                return (
                  <TableRow key={siswa.id} className="hover:bg-muted/5 border-border/40 transition-colors">
                    <TableCell className="text-center font-black text-muted-foreground/50 ">{index + 1}</TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-[11px] uppercase tracking-tight leading-none ">{siswa.nama_lengkap}</span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1 ">AKTIF</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        placeholder="--"
                        className={`text-center font-black border-none shadow-inner rounded-2xl h-12 text-sm transition-all  ${isUnderKKTP ? "bg-red-500/10 text-red-600 ring-1 ring-red-200" : "bg-white"}`}
                        value={gradesData[siswa.id]?.nilai_angka}
                        onChange={(e) => handleInputChange(siswa.id, 'nilai_angka', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-4 pr-8">
                      <div className="relative group">
                        <Textarea 
                          value={gradesData[siswa.id]?.capaian_kompetensi}
                          onChange={(e) => handleInputChange(siswa.id, 'capaian_kompetensi', e.target.value)}
                          placeholder="Narasi akan terisi otomatis sesuai Tujuan Pembelajaran..."
                          className="min-h-[90px] rounded-[1.8rem] border-none bg-muted/20 text-[11px] font-bold leading-relaxed resize-none focus:bg-white transition-all p-5 shadow-inner "
                        />
                        <Sparkles className="absolute right-4 top-4 w-3.5 h-3.5 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <div className="p-8 bg-primary/5 border-t border-primary/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 ">LENTERA • High Fidelity e-Rapor Buatan Gen-Z</p>
        </div>
      </Card>
    </div>
  )
}