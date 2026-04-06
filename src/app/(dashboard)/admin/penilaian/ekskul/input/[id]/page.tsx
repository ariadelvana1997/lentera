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
import { Badge } from "@/components/ui/badge" // Import sudah aman sekarang!
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

export default function InputNilaiEkskulPage({ params }: { params: Promise<{ id: string }> }) {
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
      const { data: ekskul } = await supabase
        .from('ekskul')
        .select('*')
        .eq('id', ekskulId)
        .single()
      setEkskulInfo(ekskul)

      const { data: anggota, error: errAnggota } = await supabase
        .from('anggota_ekskul')
        .select(`
          siswa_id,
          siswa:profiles!siswa_id(id, nama_lengkap, kelas:kelas!kelas_id(nama_kelas))
        `)
        .eq('ekskul_id', ekskulId)

      if (errAnggota) throw errAnggota

      const { data: existingGrades } = await supabase
        .from('nilai_ekskul')
        .select('*')
        .eq('ekskul_id', ekskulId)

      const gradeMap: Record<string, any> = {}
      const listSiswa = anggota?.map(a => a.siswa) || []

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
      toast.success("✅ Nilai & Narasi Ekskul berhasil disimpan!")
    } catch (err: any) {
      toast.error("Gagal simpan: " + err.message)
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
            <Link href="/admin/penilaian/ekskul"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none">Input Nilai Ekskul</h1>
            <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
              <Trophy className="w-3 h-3" /> {ekskulInfo?.nama_ekskul}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="rounded-xl font-black h-11 px-8 shadow-lg shadow-primary/20 transition-all active:scale-95">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
          SIMPAN SEMUA NILAI
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-6 text-center font-black text-[10px] uppercase text-muted-foreground">No</TableHead>
              <TableHead className="w-64 font-black text-[10px] uppercase text-primary">Nama Siswa</TableHead>
              <TableHead className="w-48 font-black text-[10px] uppercase text-muted-foreground">Predikat</TableHead>
              <TableHead className="font-black text-[10px] uppercase p-6 text-muted-foreground">Keterangan / Narasi Otomatis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center text-muted-foreground italic font-bold uppercase text-[10px]">
                  Belum ada anggota. Mapping siswa dulu ya!
                </TableCell>
              </TableRow>
            ) : members.map((siswa, index) => (
              <TableRow key={siswa.id} className="hover:bg-muted/5 border-border/50 transition-colors">
                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="py-4">
                   <div className="flex flex-col">
                     <span className="font-black text-[11px] uppercase tracking-tight leading-none">{siswa.nama_lengkap}</span>
                     <Badge variant="secondary" className="w-fit mt-1 text-[8px] h-4 uppercase font-bold px-1.5">{siswa.kelas?.nama_kelas || 'No Class'}</Badge>
                   </div>
                </TableCell>
                <TableCell>
                  <Select 
                    value={grades[siswa.id]?.nilai} 
                    onValueChange={(v) => handleNilaiChange(siswa.id, v)}
                  >
                    <SelectTrigger className="rounded-xl border-none bg-white shadow-inner font-black text-[11px] h-10 ring-1 ring-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sangat Baik">Sangat Baik</SelectItem>
                      <SelectItem value="Baik">Baik</SelectItem>
                      <SelectItem value="Cukup">Cukup</SelectItem>
                      <SelectItem value="Kurang">Kurang</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-6">
                  <div className="relative group">
                    <Textarea 
                      value={grades[siswa.id]?.keterangan}
                      onChange={(e) => setGrades(prev => ({...prev, [siswa.id]: { ...prev[siswa.id], keterangan: e.target.value }}))}
                      placeholder="Narasi akan muncul otomatis..."
                      className="min-h-[85px] rounded-2xl border-none bg-muted/20 text-[11px] font-medium leading-relaxed resize-none focus:bg-white focus:ring-1 focus:ring-primary/30 transition-all p-4 shadow-sm"
                    />
                    <Sparkles className="absolute right-3 top-3 w-3 h-3 text-primary/40 group-hover:text-primary transition-colors" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 border-dashed">
        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 animate-bounce">
          <Info className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-black text-amber-700 uppercase leading-relaxed">
          Sistem Auto-Narasi Aktif: Memilih predikat akan menghasilkan deskripsi kualitatif secara otomatis untuk laporan rapor.
        </p>
      </div>
    </div>
  )
}