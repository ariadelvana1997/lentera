"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ClipboardCheck, Search, Loader2, ChevronRight, 
  BookOpen, User, Users, Target, CheckCircle2, Clock
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

export default function InputNilaiPage() {
  const [fetching, setFetching] = useState(true)
  const [dataList, setDataList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetching(true)
    try {
      // 1. Ambil data pengampu, kelas, mapel, dan hitung nilai yang sudah masuk
      const { data, error } = await supabase
        .from('mapel_pengampu')
        .select(`
          id, kktp, tingkat,
          mapel:mata_pelajaran(nama_mapel),
          guru:profiles!guru_id(nama_lengkap),
          kelas:kelas(id, nama_kelas),
          nilai_count:nilai_akademik(count)
        `)
        .order('id', { ascending: false })

      if (data) {
        // 2. Fetch jumlah siswa per kelas untuk menghitung progress secara akurat
        const updatedData = await Promise.all(data.map(async (item: any) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('kelas_id', item.kelas?.id)
            // Filter hanya user yang punya role 'Siswa'
            .filter('roles', 'cs', '{"Siswa"}') 
          
          return { ...item, total_siswa: count || 0 }
        }))
        setDataList(updatedData)
      }
    } finally {
      setFetching(false)
    }
  }

  const filteredData = dataList.filter(item => 
    item.mapel?.nama_mapel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.guru?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kelas?.nama_kelas?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3  uppercase">
            <ClipboardCheck className="w-8 h-8 text-primary" /> Input Nilai Akademik
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest leading-none mt-1">
            Pilih Mata Pelajaran untuk Mengisi Nilai Siswa
          </p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Mapel, Guru, atau Kelas..." 
              className="pl-12 rounded-2xl h-11 bg-muted/30 border-none font-bold text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="font-black text-[10px] uppercase p-6">Mata Pelajaran & Pengampu</TableHead>
              <TableHead className="text-center font-black text-[10px] uppercase">KKTP</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Progress Pengisian</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="p-20 text-center text-muted-foreground font-bold  uppercase text-xs">Data pengampu belum tersedia.</TableCell></TableRow>
            ) : filteredData.map((item) => {
              const currentCount = item.nilai_count?.[0]?.count || 0;
              const progress = item.total_siswa > 0 
                ? Math.round((currentCount / item.total_siswa) * 100) 
                : 0
              
              return (
                <TableRow key={item.id} className="hover:bg-muted/5 transition-colors border-border/50">
                  <TableCell className="p-6">
                    <div className="flex flex-col gap-1">
                      <div className="font-black text-sm text-primary uppercase flex items-center gap-2 tracking-tight">
                        <BookOpen className="w-3.5 h-3.5" /> {item.mapel?.nama_mapel}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Badge variant="outline" className="rounded-md text-[9px] h-5 border-primary/20 text-primary">{item.kelas?.nama_kelas}</Badge>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.guru?.nama_lengkap}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-muted-foreground uppercase mb-1">Target</span>
                      <Badge className="bg-green-500/10 text-green-600 border-none font-black text-xs px-3">{item.kktp || 75}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="w-[250px]">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter">
                        <span className="flex items-center gap-1">
                          {progress === 100 ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                          {currentCount} / {item.total_siswa} Siswa
                        </span>
                        <span className={progress === 100 ? "text-green-600" : "text-primary"}>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-muted/50" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right p-6">
                    <Button asChild className="rounded-xl font-black h-10 px-5 shadow-lg group shadow-primary/20">
                      <Link href={`/admin/penilaian/input/${item.id}`}>
                        INPUT NILAI <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
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