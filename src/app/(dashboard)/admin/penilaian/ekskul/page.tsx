"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Trophy, Search, Loader2, Users, 
  ClipboardCheck, UserPlus, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import Link from "next/link"

export default function PenilaianEkskulPage() {
  const [fetching, setFetching] = useState(true)
  const [ekskulList, setEkskulList] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchEkskul()
  }, [])

  const fetchEkskul = async () => {
    setFetching(true)
    try {
      // LOG: Memastikan nama tabel sudah benar
      console.log("DEBUG: Mengambil data dari tabel 'ekskul'...");

      const { data, error } = await supabase
  .from('ekskul')
  .select(`
    *,
    anggota_count:anggota_ekskul(count) -- Ini akan mencari relasi di atas
  `)
        .order('nama_ekskul', { ascending: true })

      if (error) {
        console.error("DEBUG: Error SQL =", error.message);
      }

      console.log("DEBUG: Data yang ditemukan =", data);

      if (data) setEkskulList(data)
    } catch (err) {
      console.error("DEBUG: Catch Error =", err);
    } finally {
      setFetching(false)
    }
  }

  const filteredEkskul = ekskulList.filter(item => 
    item.nama_ekskul.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3  uppercase">
            <Trophy className="w-8 h-8 text-primary" /> Penilaian Ekskul
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest leading-none mt-1">
            Manajemen Keanggotaan & Input Capaian Ekstrakurikuler
          </p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari ekskul..." 
              className="pl-12 rounded-2xl h-11 bg-muted/30 border-none font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-6 text-center font-black text-[10px] uppercase text-muted-foreground">No</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-primary">Nama Ekstrakurikuler</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-muted-foreground text-center">Anggota Aktif</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase p-6 text-muted-foreground">Opsi Manajemen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : filteredEkskul.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <p className="text-muted-foreground  font-bold text-xs uppercase">
                    Belum ada data ekskul di tabel 'ekskul'.
                  </p>
                </TableCell>
              </TableRow>
            ) : filteredEkskul.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-muted/5 border-border/50 transition-colors">
                <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-black text-sm uppercase tracking-tight py-6">
                  {item.nama_ekskul}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full text-[10px]">
                    <Users className="w-3 h-3 mr-2" /> {item.anggota_count?.[0]?.count || 0} SISWA
                  </Badge>
                </TableCell>
                <TableCell className="text-right p-6">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" className="rounded-xl font-black text-[10px] uppercase h-10 border-primary/20 text-primary hover:bg-primary/5 shadow-sm">
                      <Link href={`/admin/penilaian/ekskul/mapping/${item.id}`}>
                        <UserPlus className="w-3.5 h-3.5 mr-2" /> Mapping Anggota
                      </Link>
                    </Button>
                    
                    <Button asChild className="rounded-xl font-black text-[10px] uppercase h-10 shadow-lg shadow-primary/20">
                      <Link href={`/admin/penilaian/ekskul/input/${item.id}`}>
                        <ClipboardCheck className="w-3.5 h-3.5 mr-2" /> Input Nilai <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}