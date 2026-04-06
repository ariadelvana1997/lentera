"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ClipboardList, Search, Loader2, Save, 
  Users, UserCheck, MessageSquare, LayoutGrid,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function AbsensiRaporPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [classList, setClassList] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [students, setStudents] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({})

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

  const loadAttendance = async (classId: string) => {
    setLoading(true)
    try {
      // 1. Ambil Siswa di kelas tersebut
      const { data: siswa, error: errSiswa } = await supabase
        .from('profiles')
        .select('id, nama_lengkap')
        .eq('kelas_id', classId)
        .order('nama_lengkap')

      if (errSiswa) throw errSiswa

      // 2. Ambil data absensi yang sudah ada
      const { data: existingData } = await supabase
        .from('absensi_rapor')
        .select('*')
        .in('siswa_id', siswa?.map(s => s.id) || [])

      // 3. Mapping ke state
      const map: Record<string, any> = {}
      siswa?.forEach(s => {
        const found = existingData?.find(d => d.siswa_id === s.id)
        map[s.id] = {
          sakit: found?.sakit || 0,
          izin: found?.izin || 0,
          alfa: found?.alfa || 0,
          catatan: found?.catatan || ""
        }
      })

      setStudents(siswa || [])
      setAttendanceData(map)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAll = async () => {
    setLoading(true)
    try {
      const payload = Object.entries(attendanceData).map(([siswaId, val]) => ({
        siswa_id: siswaId,
        sakit: parseInt(val.sakit) || 0,
        izin: parseInt(val.izin) || 0,
        alfa: parseInt(val.alfa) || 0,
        catatan: val.catatan
      }))

      const { error } = await supabase
        .from('absensi_rapor')
        .upsert(payload, { onConflict: 'siswa_id' })

      if (error) throw error
      toast.success("✅ Data Absensi & Catatan berhasil disimpan!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3  uppercase">
            <ClipboardList className="w-8 h-8 text-primary" /> Absensi & Catatan
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest leading-none mt-1">
            Rekap Kehadiran Siswa & Pesan Wali Kelas
          </p>
        </div>
        
        {students.length > 0 && (
          <Button onClick={handleSaveAll} disabled={loading} className="rounded-xl font-black h-11 px-8 shadow-lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            SIMPAN SEMUA
          </Button>
        )}
      </div>

      {/* FILTER KELAS */}
      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2rem] p-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="font-black text-[10px] uppercase text-muted-foreground tracking-tighter">Pilih Rombel:</span>
          </div>
          <Select 
            value={selectedClassId} 
            onValueChange={(v) => { setSelectedClassId(v); loadAttendance(v); }}
          >
            <SelectTrigger className="w-full md:w-80 rounded-xl border-none bg-white shadow-sm font-black text-xs h-11">
              <SelectValue placeholder="Klik untuk memilih kelas..." />
            </SelectTrigger>
            <SelectContent>
              {classList.map((k) => (
                <SelectItem key={k.id} value={k.id} className="font-bold">{k.nama_kelas}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* TABLE DATA */}
      {selectedClassId ? (
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-none">
                <TableHead className="w-12 p-6 text-center font-black text-[10px] uppercase text-muted-foreground">No</TableHead>
                <TableHead className="w-64 font-black text-[10px] uppercase text-primary">Nama Siswa</TableHead>
                <TableHead className="w-24 text-center font-black text-[10px] uppercase text-red-500">Sakit</TableHead>
                <TableHead className="w-24 text-center font-black text-[10px] uppercase text-amber-500">Izin</TableHead>
                <TableHead className="w-24 text-center font-black text-[10px] uppercase text-slate-500">Alfa</TableHead>
                <TableHead className="font-black text-[10px] uppercase p-6 text-muted-foreground">Catatan Wali Kelas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : students.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center font-bold text-muted-foreground uppercase text-xs ">Belum ada siswa di kelas ini.</TableCell></TableRow>
              ) : students.map((siswa, index) => (
                <TableRow key={siswa.id} className="hover:bg-muted/5 border-border/50 transition-colors">
                  <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-black text-[11px] uppercase py-4">{siswa.nama_lengkap}</TableCell>
                  
                  {/* INPUT ABSENSI */}
                  <TableCell>
                    <Input 
                      type="number" 
                      className="text-center font-black border-none bg-white shadow-inner rounded-lg h-10"
                      value={attendanceData[siswa.id]?.sakit}
                      onChange={(e) => setAttendanceData(prev => ({...prev, [siswa.id]: {...prev[siswa.id], sakit: e.target.value}}))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      className="text-center font-black border-none bg-white shadow-inner rounded-lg h-10"
                      value={attendanceData[siswa.id]?.izin}
                      onChange={(e) => setAttendanceData(prev => ({...prev, [siswa.id]: {...prev[siswa.id], izin: e.target.value}}))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      className="text-center font-black border-none bg-white shadow-inner rounded-lg h-10"
                      value={attendanceData[siswa.id]?.alfa}
                      onChange={(e) => setAttendanceData(prev => ({...prev, [siswa.id]: {...prev[siswa.id], alfa: e.target.value}}))}
                    />
                  </TableCell>

                  {/* INPUT CATATAN */}
                  <TableCell className="p-4">
                    <Textarea 
                      placeholder="Masukkan catatan perkembangan, motivasi, atau pesan wali kelas..."
                      className="min-h-[60px] rounded-xl border-none bg-muted/20 text-[11px] font-medium resize-none focus:bg-white transition-all p-3"
                      value={attendanceData[siswa.id]?.catatan}
                      onChange={(e) => setAttendanceData(prev => ({...prev, [siswa.id]: {...prev[siswa.id], catatan: e.target.value}}))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <AlertCircle className="w-16 h-16 mb-4" />
          <p className="font-black text-sm uppercase ">Silakan pilih kelas terlebih dahulu untuk memulai rekap.</p>
        </div>
      )}
    </div>
  )
}