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

export default function WaliKelasPenilaianEkskulPage() {
  const [fetching, setFetching] = useState(true)
  const [ekskulList, setEkskulList] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchEkskul()
  }, [])

  const fetchEkskul = async () => {
    setFetching(true)
    try {
      // Menarik data ekskul dan menghitung jumlah anggota aktif secara otomatis
      const { data, error } = await supabase
        .from('ekskul')
        .select(`
          *,
          anggota_count:anggota_ekskul(count)
        `)
        .order('nama_ekskul', { ascending: true })

      if (error) throw error
      if (data) setEkskulList(data)
    } catch (err: any) {
      console.error("DEBUG: Error fetch ekskul =", err.message)
    } finally {
      setFetching(false)
    }
  }

  const filteredEkskul = ekskulList.filter(item => 
    item.nama_ekskul.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 uppercase">
            <Trophy className="w-8 h-8 text-primary" /> Penilaian Ekskul
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest leading-none mt-1">
            Manajemen Keanggotaan & Input Nilai Ekstrakurikuler Sultan
          </p>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden relative">
        <div className="p-6 border-b border-border/50 bg-primary/5">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input 
              placeholder="Cari nama ekskul..." 
              className="pl-12 rounded-2xl h-12 bg-background/60 border-none font-black text-xs shadow-inner "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-none">
                <TableHead className="w-12 p-8 text-center font-black text-[10px] uppercase ">No</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-primary ">Nama Ekstrakurikuler</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-center ">Anggota Aktif</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase p-8 ">Opsi Manajemen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetching ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredEkskul.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <p className="text-muted-foreground font-black text-[10px] uppercase  opacity-40 ">
                      Data ekskul belum tersedia di database.
                    </p>
                  </TableCell>
                </TableRow>
              ) : filteredEkskul.map((item, index) => (
                <TableRow key={item.id} className="hover:bg-primary/5 border-border/40 transition-colors">
                  <TableCell className="text-center font-black text-muted-foreground/40 ">{index + 1}</TableCell>
                  <TableCell className="font-black text-sm uppercase tracking-tight py-6  text-foreground/80">
                    {item.nama_ekskul}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1.5 rounded-xl text-[9px] shadow-sm">
                      <Users className="w-3.5 h-3.5 mr-2" /> {item.anggota_count?.[0]?.count || 0} SISWA
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right p-8">
                    <div className="flex justify-end gap-3">
                      <Button asChild variant="outline" className="rounded-xl font-black text-[10px] uppercase h-11 border-primary/20 text-primary hover:bg-primary/10 shadow-sm  px-6 transition-all active:scale-95">
                        <Link href={`/walikelas/master-penilaian/ekskul/mapping/${item.id}`}>
                          <UserPlus className="w-4 h-4 mr-2" /> Mapping
                        </Link>
                      </Button>
                      
                      <Button asChild className="rounded-xl font-black text-[10px] uppercase h-11 shadow-xl shadow-primary/20 px-6  transition-all active:scale-95 hover:scale-[1.02]">
                        <Link href={`/walikelas/master-penilaian/ekskul/input/${item.id}`}>
                          <ClipboardCheck className="w-4 h-4 mr-2" /> Input Nilai <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="p-8 bg-primary/5 border-t border-primary/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 ">LENTERA • Ekstrakurikuler Buatan Gen-Z</p>
        </div>
      </Card>
    </div>
  )
}