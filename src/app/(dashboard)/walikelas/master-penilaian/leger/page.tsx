"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Loader2, Download, 
  LayoutGrid, FileSpreadsheet, AlertCircle,
  Printer, GraduationCap, Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { toast } from "sonner"

export default function WaliKelasLegerNilaiPage() {
  const [fetching, setFetching] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [myClass, setMyClass] = useState<any>(null)
  
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [gradesMap, setGradesMap] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchWaliClass()
  }, [])

  const fetchWaliClass = async () => {
    setFetching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Cari Kelas Perwalian
      const { data: kelas, error: errKelas } = await supabase
        .from('kelas')
        .select('*')
        .eq('wali_id', user.id)
        .maybeSingle()

      if (errKelas) throw errKelas

      if (kelas) {
        setMyClass(kelas)
        await loadLeger(kelas.id)
      }
    } catch (err: any) {
      toast.error("Gagal mendeteksi kelas perwalian: " + err.message)
    } finally {
      setFetching(false)
    }
  }

  const loadLeger = async (classId: string) => {
    setLoadingData(true)
    try {
      // 1. Ambil Mapel yang aktif di kelas tersebut via mapel_pengampu
      const { data: pengampu, error: errPengampu } = await supabase
        .from('mapel_pengampu')
        .select(`
          mapel_id,
          mapel:mata_pelajaran(id, nama_mapel)
        `)
        .eq('kelas_id', classId)

      if (errPengampu) throw errPengampu

      const dataPengampu = (pengampu as any[]) || []
      // Filter unik Mapel
      const uniqueSubjects = Array.from(
        new Map(dataPengampu.filter(p => p.mapel).map(p => [p.mapel?.id, p.mapel])).values()
      )

      // 2. Ambil Siswa di kelas perwalian
      const { data: siswa } = await supabase
        .from('profiles')
        .select('id, nama_lengkap')
        .eq('kelas_id', classId)
        .filter('roles', 'cs', '{"Siswa"}')
        .order('nama_lengkap')

      const studentIds = (siswa as any[])?.map(s => s.id) || []

      // 3. Ambil Nilai Akademik
      const { data: nilai } = await supabase
        .from('nilai_akademik')
        .select(`
          siswa_id,
          nilai_angka,
          mapel_pengampu!inner(mapel_id)
        `)
        .in('siswa_id', studentIds)

      // 4. Pivot Logic: Mapping [siswa_id][mapel_id]
      const gMap: Record<string, any> = {}
      const dataNilai = (nilai as any[]) || []
      
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

  if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  if (!myClass) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 ">
      <AlertCircle className="w-16 h-16 text-amber-500 opacity-20" />
      <h2 className="text-xl font-black uppercase ">Menu Khusus Wali Kelas</h2>
      <p className="text-muted-foreground text-sm font-bold max-w-sm uppercase ">Anda tidak terdaftar sebagai wali kelas di rombel mana pun.</p>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 ">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="h-14 w-14 rounded-3xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20">
              <FileSpreadsheet className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-none">
                Leger Nilai Sultan
              </h1>
              <div className="flex items-center gap-2 mt-2">
                 <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-3  shadow-sm">
                    REKAPITULASI KELAS {myClass.nama_kelas}
                 </Badge>
                 <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] uppercase px-3  flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Wali Kelas Aktif
                 </Badge>
              </div>
           </div>
        </div>
        
        {students.length > 0 && (
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl font-black h-12 border-primary/20 text-primary hover:bg-primary/5 uppercase text-[10px] tracking-widest px-6 shadow-sm">
              <Printer className="w-4 h-4 mr-2" /> Cetak Leger
            </Button>
            <Button className="rounded-2xl font-black h-12 px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase text-[10px] tracking-widest bg-primary text-white">
              <Download className="w-4 h-4 mr-2" /> Export Excel
            </Button>
          </div>
        )}
      </div>

      {/* STATS SUMMARY */}
      <Card className="border-none shadow-xl bg-gradient-to-r from-primary/10 to-transparent rounded-[2.5rem] p-8 flex items-center gap-5 border-l-8 border-l-primary">
         <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
            <Star className="w-7 h-7" />
         </div>
         <div className="space-y-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Informasi Leger:</p>
            <p className="text-sm font-black text-foreground/70 uppercase leading-tight ">
               Tabel ini merangkum {subjects.length} Mata Pelajaran untuk {students.length} Peserta Didik di Rombel {myClass.nama_kelas}.
            </p>
         </div>
      </Card>

      {/* LEGER TABLE */}
      <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[3.5rem] overflow-hidden relative">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-none">
                <TableHead className="sticky left-0 bg-white/95 backdrop-blur-md z-30 w-12 p-8 text-center font-black text-[10px] uppercase text-muted-foreground border-r ">No</TableHead>
                <TableHead className="sticky left-12 bg-white/95 backdrop-blur-md z-30 w-72 font-black text-[10px] uppercase text-primary border-r  shadow-[10px_0_15px_-10px_rgba(0,0,0,0.1)]">Nama Lengkap Peserta Didik</TableHead>
                
                {subjects.map((m) => (
                  <TableHead key={m.id} className="text-center font-black text-[10px] uppercase text-muted-foreground px-6 min-w-[140px] border-r ">
                    {m.nama_mapel}
                  </TableHead>
                ))}
                
                <TableHead className="text-center font-black text-[10px] uppercase text-primary bg-primary/5 px-8 min-w-[120px] ">
                   Rata-Rata
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingData ? (
                <TableRow>
                  <TableCell colSpan={subjects.length + 3} className="h-60 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                    <p className="mt-4 font-black uppercase text-[10px] tracking-widest opacity-30 ">Menyusun Data Sultan...</p>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={subjects.length + 3} className="h-60 text-center font-black text-muted-foreground uppercase text-[10px]  opacity-30">
                    Belum ada data nilai yang masuk di rombel ini.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((siswa, index) => (
                  <TableRow key={siswa.id} className="hover:bg-primary/5 border-border/40 transition-colors">
                    <TableCell className="sticky left-0 bg-white/90 backdrop-blur-md text-center font-black text-muted-foreground/40 border-r text-xs ">{index + 1}</TableCell>
                    <TableCell className="sticky left-12 bg-white/90 backdrop-blur-md font-black text-[11px] uppercase py-6 border-r  shadow-[10px_0_15px_-10px_rgba(0,0,0,0.1)] text-foreground/80">
                      {siswa.nama_lengkap}
                    </TableCell>
                    
                    {subjects.map((m) => {
                      const nilai = gradesMap[siswa.id]?.[m.id] || "-"
                      const isUnderKKTP = nilai !== "-" && Number(nilai) < 75;
                      return (
                        <TableCell key={`${siswa.id}-${m.id}`} className="text-center font-black text-xs border-r ">
                          <span className={isUnderKKTP ? "text-red-600 bg-red-500/10 px-2 py-1 rounded-lg" : "text-foreground/60"}>
                            {nilai}
                          </span>
                        </TableCell>
                      )
                    })}

                    <TableCell className="text-center bg-primary/5">
                      <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-4 py-1.5 rounded-xl shadow-inner ">
                        {calculateAverage(siswa.id)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" className="bg-primary/10 h-3" />
        </ScrollArea>
      </Card>

      {/* FOOTER LEGEND */}
      <div className="flex flex-wrap gap-6 items-center p-6 bg-muted/20 rounded-[2rem] border border-border/50">
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-red-500" />
             <span className="text-[9px] font-black uppercase opacity-60 ">Dibawah KKTP (75)</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-primary" />
             <span className="text-[9px] font-black uppercase opacity-60 ">Sudah Tuntas</span>
          </div>
          <p className="ml-auto text-[10px] font-black uppercase tracking-widest text-primary/40 ">LENTERA • High Fidelity Leger Analytics</p>
      </div>
    </div>
  )
}