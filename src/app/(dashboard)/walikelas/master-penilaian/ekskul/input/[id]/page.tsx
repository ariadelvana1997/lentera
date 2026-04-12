"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ChevronLeft, Loader2, Save, User, 
  Trophy, Star, MessageSquare, Info, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" 
import { Textarea } from "@/components/ui/textarea"
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

export default function WaliKelasInputNilaiEkskulDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: ekskulId } = use(params)
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [ekskulInfo, setEkskulInfo] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [grades, setGrades] = useState<Record<string, any>>({})

  useEffect(() => {
    loadInitialData()
  }, [ekskulId])

  const loadInitialData = async () => {
    setFetching(true)
    try {
      // 1. Ambil Info Ekskul
      const { data: ekskul } = await supabase
        .from('ekskul')
        .select('*')
        .eq('id', ekskulId)
        .single()
      setEkskulInfo(ekskul)

      // 2. Ambil Anggota Ekskul & Profile
      const { data: anggota, error: errAnggota } = await supabase
        .from('anggota_ekskul')
        .select(`
          siswa_id,
          siswa:profiles!siswa_id(id, nama_lengkap, kelas:kelas!kelas_id(nama_kelas))
        `)
        .eq('ekskul_id', ekskulId)

      if (errAnggota) throw errAnggota

      // 3. Ambil Nilai yang sudah tersimpan
      const { data: existingGrades } = await supabase
        .from('nilai_ekskul')
        .select('*')
        .eq('ekskul_id', ekskulId)

      const gradeMap: Record<string, any> = {}
      const listSiswa = anggota?.map(a => a.siswa).filter(s => s !== null) || []

      listSiswa.forEach((s: any) => {
        const found = existingGrades?.find(g => g.siswa_id === s.id)
        gradeMap[s.id] = {
          nilai: found?.nilai || "Baik", 
          keterangan: found?.keterangan || ""
        }
      })

      setMembers(listSiswa)
      setGrades(gradeMap)
    } catch (err: any) {
      toast.error("Gagal memuat data: " + err.message)
    } finally {
      setFetching(false)
    }
  }

  const handleNilaiChange = (siswaId: string, predikat: string) => {
    const namaEkskul = ekskulInfo?.nama_ekskul || "Kegiatan Ekstrakurikuler"
    let narasi = ""

    // LOGIKA AUTO-NARASI LENTERA (Sesuai Predikat)
    switch (predikat) {
      case "Sangat Baik":
        narasi = `Menunjukkan penguasaan yang sangat baik, disiplin, dan aktif berkontribusi dalam seluruh kegiatan ${namaEkskul}.`
        break
      case "Baik":
        narasi = `Menunjukkan penguasaan yang baik dan berpartisipasi aktif dalam kegiatan ${namaEkskul} dengan konsisten.`
        break
      case "Cukup":
        narasi = `Menunjukkan penguasaan yang cukup dalam kegiatan ${namaEkskul}, perlu meningkatkan konsistensi kehadiran.`
        break
      case "Kurang":
        narasi = `Perlu bimbingan lebih lanjut dan peningkatan motivasi dalam mengikuti kegiatan ${namaEkskul}.`
        break
      default:
        narasi = ""
    }

    setGrades(prev => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], nilai: predikat, keterangan: narasi }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload = Object.entries(grades).map(([siswaId, data]) => ({
        ekskul_id: ekskulId,
        siswa_id: siswaId,
        nilai: data.nilai,
        keterangan: data.keterangan
      }))

      if (payload.length === 0) return toast.error("Tidak ada data untuk disimpan")

      const { error } = await supabase
        .from('nilai_ekskul')
        .upsert(payload, { onConflict: 'ekskul_id,siswa_id' })

      if (error) throw error
      toast.success("✅ Nilai & Narasi Ekskul Berhasil Disimpan!")
    } catch (err: any) {
      toast.error("Gagal simpan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 ">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-border/50 h-11 w-11 hover:bg-muted">
            <Link href="/walikelas/master-penilaian/ekskul"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none ">Input Nilai Ekskul</h1>
            <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2 ">
              <Trophy className="w-3.5 h-3.5" /> {ekskulInfo?.nama_ekskul}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="rounded-2xl font-black h-12 px-10 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase text-[11px] tracking-widest">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
          SIMPAN SEMUA NILAI
        </Button>
      </div>

      {/* TABLE PENILAIAN */}
      <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[3rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-8 text-center font-black text-[10px] uppercase text-muted-foreground ">No</TableHead>
              <TableHead className="w-64 font-black text-[10px] uppercase text-primary ">Nama Lengkap Siswa</TableHead>
              <TableHead className="w-48 font-black text-[10px] uppercase text-muted-foreground ">Predikat Capaian</TableHead>
              <TableHead className="font-black text-[10px] uppercase p-6 text-muted-foreground ">Keterangan / Narasi Otomatis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-60 text-center text-muted-foreground font-black uppercase text-[10px]  opacity-40">
                  <div className="flex flex-col items-center gap-3">
                    <User className="w-10 h-10 opacity-20" />
                    Belum ada anggota. Mapping siswa dulu ya!
                  </div>
                </TableCell>
              </TableRow>
            ) : members.map((siswa, index) => (
              <TableRow key={siswa.id} className="hover:bg-primary/5 border-border/40 transition-colors">
                <TableCell className="text-center font-black text-muted-foreground/50 ">{index + 1}</TableCell>
                <TableCell className="py-6">
                   <div className="flex flex-col">
                     <span className="font-black text-[11px] uppercase tracking-tight leading-none  text-foreground/80">{siswa.nama_lengkap}</span>
                     <Badge variant="secondary" className="w-fit mt-2 text-[8px] h-4.5 uppercase font-black px-2 py-0  bg-white border border-border shadow-sm">
                        {siswa.kelas?.nama_kelas || 'NO CLASS'}
                     </Badge>
                   </div>
                </TableCell>
                <TableCell>
                  <Select 
                    value={grades[siswa.id]?.nilai} 
                    onValueChange={(v) => handleNilaiChange(siswa.id, v)}
                  >
                    <SelectTrigger className="rounded-2xl border-none bg-white shadow-inner font-black text-[11px] h-12 ring-1 ring-primary/10 ">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl font-black uppercase text-[10px] ">
                      <SelectItem value="Sangat Baik" className="cursor-pointer">Sangat Baik</SelectItem>
                      <SelectItem value="Baik" className="cursor-pointer">Baik</SelectItem>
                      <SelectItem value="Cukup" className="cursor-pointer">Cukup</SelectItem>
                      <SelectItem value="Kurang" className="cursor-pointer">Kurang</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-4 pr-8">
                  <div className="relative group">
                    <Textarea 
  value={grades[siswa.id]?.keterangan || ""}
  onChange={(e) => setGrades(prev => ({
    ...prev, 
    [siswa.id]: { 
      ...(prev[siswa.id] || {}), // Gunakan || {} untuk menghindari error undefined
      keterangan: e.target.value 
    }
  }))}
  placeholder="Narasi akan muncul otomatis..."
  className="min-h-[95px] rounded-[1.8rem] border-none bg-muted/20 text-[11px] font-bold leading-relaxed resize-none focus:bg-white transition-all p-5 shadow-inner "
/>
                    <Sparkles className="absolute right-4 top-4 w-3.5 h-3.5 text-primary/40 group-hover:text-primary transition-colors" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* FOOTER LENTERA */}
        <div className="p-8 bg-primary/5 border-t border-primary/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 ">LENTERA • High Fidelity e-Rapor Buatan Gen-Z</p>
        </div>
      </Card>

      {/* AUTO NARRATIVE INFO */}
      <div className="flex items-center gap-4 p-5 bg-amber-500/5 rounded-[2rem] border border-amber-500/20 border-dashed animate-in slide-in-from-bottom-2">
        <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-sm shadow-amber-200">
          <Info className="w-5 h-5" />
        </div>
        <p className="text-[10px] font-black text-amber-700 uppercase leading-relaxed ">
          Smart Auto-Narrative Enabled: Memilih predikat akan menghasilkan deskripsi kualitatif yang "Sultan" secara otomatis untuk laporan rapor.
        </p>
      </div>
    </div>
  )
}