"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Printer, Users, Search, Loader2, 
  FileText, UserCircle, LayoutGrid, ChevronRight 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { toast } from "sonner"
import Link from "next/link"

export default function MenuCetakRaporPage() {
  const [fetching, setFetching] = useState(true)
  const [classList, setClassList] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

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

  const loadStudents = async (classId: string) => {
    setFetching(true)
    try {
      console.log("Mencari siswa untuk kelas ID:", classId);

      const { data, error } = await supabase
  .from('profiles')
  .select('id, nama_lengkap, nisn, roles') // Kolom nisn sekarang sudah ada!
  .eq('kelas_id', classId)
  .filter('roles', 'cs', '{"Siswa"}')
        .order('nama_lengkap')

      if (error) {
        console.error("Kesalahan database:", error.message);
        toast.error(error.message);
      }

      console.log("Siswa ditemukan:", data);
      setStudents(data || [])

      if (data?.length === 0) {
        toast.info("Data siswa tidak ditemukan. Pastikan 'kelas_id' dan 'role' siswa sudah benar.");
      }
    } finally {
      setFetching(false)
    }
  }
  const filteredStudents = students.filter(s => 
    s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3  uppercase">
            <Printer className="w-8 h-8 text-primary" /> Cetak Rapor
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">
            Pusat Pencetakan Dokumen Hasil Belajar Siswa
          </p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2rem] p-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="font-black text-[10px] uppercase text-muted-foreground">Pilih Rombel:</span>
          </div>
          <Select 
            onValueChange={(v) => { setSelectedClass(v); loadStudents(v); }}
          >
            <SelectTrigger className="w-full md:w-80 rounded-xl border-none bg-white shadow-sm font-black text-xs h-11">
              <SelectValue placeholder="Klik untuk memilih kelas..." />
            </SelectTrigger>
            <SelectContent>
              {classList.map((k) => (
                <SelectItem key={k.id} value={k.id} className="font-bold uppercase text-[10px]">{k.nama_kelas}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {selectedClass && (
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama siswa..." 
                className="pl-12 rounded-2xl h-11 bg-white border-none font-bold text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-none">
                <TableHead className="w-12 text-center font-black text-[10px] uppercase p-6">No</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-primary">Nama Lengkap Siswa</TableHead>
                <TableHead className="hidden md:table-cell font-black text-[10px] uppercase text-muted-foreground text-center">NISN</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase p-6">Opsi Cetak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetching ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center font-bold text-muted-foreground uppercase text-[10px] ">Siswa tidak ditemukan.</TableCell></TableRow>
              ) : filteredStudents.map((s, index) => (
                <TableRow key={s.id} className="hover:bg-muted/5 border-border/50 transition-colors">
                  <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-black text-[11px] uppercase py-4">{s.nama_lengkap}</TableCell>
                  <TableCell className="hidden md:table-cell text-center font-bold text-xs text-muted-foreground">{s.nisn || "-"}</TableCell>
                  <TableCell className="text-right p-4">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" className="rounded-xl font-black text-[9px] h-9 border-primary/20 text-primary hover:bg-primary/5">
                        <Link href={`/admin/cetak-rapor/rapor/identitas/${s.id}`} target="_blank">
                          <UserCircle className="w-3 h-3 mr-2" /> BIODATA
                        </Link>
                      </Button>
                      <Button asChild className="rounded-xl font-black text-[9px] h-9 shadow-lg shadow-primary/20">
                        <Link href={`/admin/cetak-rapor/rapor/isi/${s.id}`} target="_blank">
                          <FileText className="w-3 h-3 mr-2" /> ISI RAPOR
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}