"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ClipboardCheck, Search, Loader2, ChevronRight, 
  BookOpen, User, Users, CheckCircle2, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import Link from "next/link"

export default function WaliKelasInputNilaiIndexPage() {
  const [fetching, setFetching] = useState(true)
  const [dataList, setDataList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetching(true)
    try {
      // 1. Dapatkan User ID yang sedang login
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 2. Ambil data mapel yang diampu oleh user ini saja (Wali Kelas sebagai Guru Mapel)
      const { data, error } = await supabase
        .from('mapel_pengampu')
        .select(`
          id, kktp, tingkat,
          mapel:mata_pelajaran(nama_mapel),
          guru:profiles!guru_id(nama_lengkap),
          kelas:kelas(id, nama_kelas),
          nilai_count:nilai_akademik(count)
        `)
        .eq('guru_id', user.id) // <--- FILTER: Hanya yang diampu walikelas ini
        .order('id', { ascending: false })

      if (error) throw error

      if (data) {
        // 3. Hitung jumlah siswa per kelas untuk bar progress
        const updatedData = await Promise.all(data.map(async (item: any) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('kelas_id', item.kelas?.id)
            .filter('roles', 'cs', '{"Siswa"}') 
          
          return { ...item, total_siswa: count || 0 }
        }))
        setDataList(updatedData)
      }
    } catch (err: any) {
      console.error("Error Fetching Data:", err.message)
    } finally {
      setFetching(false)
    }
  }

  const filteredData = dataList.filter(item => 
    item.mapel?.nama_mapel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kelas?.nama_kelas?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 uppercase">
            <ClipboardCheck className="w-8 h-8 text-primary" /> Input Nilai Akademik
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest leading-none mt-1">
            Data Mata Pelajaran yang Anda Ampu
          </p>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden relative">
        <div className="p-6 border-b border-border/50 bg-primary/5">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input 
              placeholder="Cari Mata Pelajaran atau Kelas..." 
              className="pl-12 rounded-2xl h-12 bg-background/60 border-none font-black text-xs shadow-inner "
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-none">
                <TableHead className="font-black text-[10px] uppercase p-6 ">Mata Pelajaran & Kelas</TableHead>
                <TableHead className="text-center font-black text-[10px] uppercase ">Target KKM</TableHead>
                <TableHead className="font-black text-[10px] uppercase ">Status Pengisian</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase p-6 ">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetching ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-20 text-center text-muted-foreground font-black uppercase text-[10px]  opacity-40">
                    Tidak ada jadwal mengajar yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : filteredData.map((item) => {
                const currentCount = item.nilai_count?.[0]?.count || 0;
                const progress = item.total_siswa > 0 
                  ? Math.round((currentCount / item.total_siswa) * 100) 
                  : 0
                
                return (
                  <TableRow key={item.id} className="hover:bg-primary/5 transition-colors border-border/40">
                    <TableCell className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="font-black text-sm text-primary uppercase flex items-center gap-2 tracking-tight ">
                          <BookOpen className="w-4 h-4" /> {item.mapel?.nama_mapel}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ">
                          <Badge variant="outline" className="rounded-lg text-[9px] h-5 border-primary/30 text-primary bg-primary/5">
                            KELAS {item.kelas?.nama_kelas}
                          </Badge>
                          <span className="flex items-center gap-1 opacity-60">
                            <Users className="w-3 h-3" /> {item.total_siswa} Siswa
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-muted-foreground uppercase mb-1 opacity-50">KKTP</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black text-xs px-3 rounded-lg shadow-sm">
                          {item.kktp || 75}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="w-[280px]">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter ">
                          <span className="flex items-center gap-1">
                            {progress === 100 ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                            )}
                            {currentCount} / {item.total_siswa} Terisi
                          </span>
                          <span className={progress === 100 ? "text-emerald-600" : "text-primary"}>
                            {progress}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-2 bg-primary/10" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-6">
                      <Button asChild className="rounded-xl font-black h-11 px-6 shadow-xl group shadow-primary/20 hover:scale-[1.02] transition-all ">
                        <Link href={`/walikelas/master-penilaian/input/${item.id}`}>
                          ISI NILAI <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}