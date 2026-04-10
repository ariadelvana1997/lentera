"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  BookOpen, Loader2, Download, 
  LayoutGrid, FileSpreadsheet, AlertCircle,
  Printer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { toast } from "sonner"

export default function LegerNilaiPage() {
  const [fetching, setFetching] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [classList, setClassList] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [gradesMap, setGradesMap] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const { data } = await supabase.from('kelas').select('*').order('nama_kelas')
      if (data) setClassList(data)
    } finally {
      setFetching(false)
    }
  }

  const loadLeger = async (classId: string) => {
    setLoadingData(true)
    try {
      // 1. Ambil Mapel dari mapel_pengampu
      // FIX: Menghapus komentar "--" yang menyebabkan ParserError di Vercel
      const { data: pengampu, error: errPengampu } = await supabase
        .from('mapel_pengampu')
        .select(`
          mapel_id,
          mapel:mata_pelajaran(id, nama_mapel)
        `)
        .eq('kelas_id', classId)

      if (errPengampu) throw errPengampu;

      // FIX: Casting ke "any[]" agar TypeScript tidak bingung saat proses .map()
      const dataPengampu = (pengampu as any[]) || [];

      // Ambil ID mapel yang unik
      const uniqueSubjects = Array.from(
        new Map(dataPengampu.filter(p => p.mapel).map(p => [p.mapel?.id, p.mapel])).values()
      )

      // 2. Ambil Siswa
      const { data: siswa } = await supabase
        .from('profiles')
        .select('id, nama_lengkap')
        .eq('kelas_id', classId)
        .filter('roles', 'cs', '{"Siswa"}')
        .order('nama_lengkap')

      // 3. Ambil Nilai
      const studentIds = (siswa as any[])?.map(s => s.id) || [];
      
      const { data: nilai } = await supabase
        .from('nilai_akademik')
        .select(`
          siswa_id,
          nilai_angka,
          mapel_pengampu!inner(mapel_id)
        `)
        .in('siswa_id', studentIds)

      // 4. Mapping [siswa_id][mapel_id]
      const gMap: Record<string, any> = {}
      const dataNilai = (nilai as any[]) || [];
      
      dataNilai.forEach(n => {
        const mId = n.mapel_pengampu?.mapel_id
        if (mId) {
          if (!gMap[n.siswa_id]) gMap[n.siswa_id] = {}
          gMap[n.siswa_id][mId] = n.nilai_angka
        }
      })

      setSubjects(uniqueSubjects)
      setStudents(siswa || [])
      setGradesMap(gMap)

      if (uniqueSubjects.length === 0) {
        toast.error("Tidak ada Mata Pelajaran yang diatur untuk kelas ini.");
      }

    } catch (err: any) {
      toast.error("Gagal memuat leger: " + err.message)
    } finally {
      setLoadingData(false)
    }
  }

  const calculateAverage = (siswaId: string) => {
    const siswaGrades = gradesMap[siswaId] || {}
    const values = Object.values(siswaGrades).map(v => Number(v))
    if (values.length === 0 || subjects.length === 0) return "0"
    const sum = values.reduce((a, b) => a + b, 0)
    return (sum / subjects.length).toFixed(1)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 uppercase">
            <FileSpreadsheet className="w-8 h-8 text-primary" /> Leger Nilai
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest leading-none mt-1">
            Rekapitulasi Nilai Seluruh Mata Pelajaran
          </p>
        </div>
        
        {students.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl font-black h-11 border-primary/20 text-primary hover:bg-primary/5">
              <Printer className="w-4 h-4 mr-2" /> CETAK
            </Button>
            <Button className="rounded-xl font-black h-11 px-6 shadow-lg shadow-primary/20">
              <Download className="w-4 h-4 mr-2" /> EXPORT EXCEL
            </Button>
          </div>
        )}
      </div>

      {/* FILTER */}
      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2rem] p-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="font-black text-[10px] uppercase text-muted-foreground">Pilih Rombel:</span>
          </div>
          <Select 
            value={selectedClassId} 
            onValueChange={(v) => { setSelectedClassId(v); loadLeger(v); }}
          >
            <SelectTrigger className="w-full md:w-80 rounded-xl border-none bg-white shadow-sm font-black text-xs h-11 focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="Pilih kelas..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {classList.map((k) => (
                <SelectItem key={k.id} value={k.id} className="font-bold uppercase text-[11px] cursor-pointer">
                  {k.nama_kelas}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* TABLE */}
      {selectedClassId ? (
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-none">
                  <TableHead className="sticky left-0 bg-white/80 backdrop-blur-md z-20 w-12 p-6 text-center font-black text-[10px] uppercase text-muted-foreground border-r">No</TableHead>
                  <TableHead className="sticky left-12 bg-white/80 backdrop-blur-md z-20 w-64 font-black text-[10px] uppercase text-primary border-r">Nama Siswa</TableHead>
                  
                  {subjects.map((m) => (
                    <TableHead key={m.id} className="text-center font-black text-[10px] uppercase text-muted-foreground px-4 min-w-[120px] border-r">
                      {m.nama_mapel}
                    </TableHead>
                  ))}
                  
                  <TableHead className="text-center font-black text-[10px] uppercase text-primary bg-primary/5 px-6">Rata-Rata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingData ? (
                  <TableRow>
                    <TableCell colSpan={subjects.length + 3} className="h-40 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={subjects.length + 3} className="h-40 text-center font-bold text-muted-foreground uppercase text-xs">
                      Tidak ada siswa ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((siswa, index) => (
                    <TableRow key={siswa.id} className="hover:bg-muted/5 border-border/50 transition-colors">
                      <TableCell className="sticky left-0 bg-white/90 backdrop-blur-md text-center font-bold text-muted-foreground border-r text-xs">{index + 1}</TableCell>
                      <TableCell className="sticky left-12 bg-white/90 backdrop-blur-md font-black text-[11px] uppercase py-4 border-r">
                        {siswa.nama_lengkap}
                      </TableCell>
                      
                      {subjects.map((m) => {
                        const nilai = gradesMap[siswa.id]?.[m.id] || "-"
                        return (
                          <TableCell key={`${siswa.id}-${m.id}`} className="text-center font-bold text-xs border-r">
                            <span className={Number(nilai) < 75 && nilai !== "-" ? "text-red-500" : "text-slate-700"}>
                              {nilai}
                            </span>
                          </TableCell>
                        )
                      })}

                      <TableCell className="text-center bg-primary/5">
                        <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-3">
                          {calculateAverage(siswa.id)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <AlertCircle className="w-16 h-16 mb-4" />
          <p className="font-black text-sm uppercase text-center text-muted-foreground">
            Pilih kelas untuk melihat rekapitulasi nilai.
          </p>
        </div>
      )}
    </div>
  )
}