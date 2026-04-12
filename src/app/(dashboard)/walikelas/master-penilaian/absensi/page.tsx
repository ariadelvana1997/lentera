"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ClipboardList, Loader2, Save, 
  Users, LayoutGrid, AlertCircle, Sparkles,
  MessageSquare, GraduationCap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function WaliKelasAbsensiRaporPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [myClass, setMyClass] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchWaliData()
  }, [])

  const fetchWaliData = async () => {
    setFetching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: kelas, error: errKelas } = await supabase
        .from('kelas')
        .select('*')
        .eq('wali_id', user.id)
        .maybeSingle()

      if (errKelas) throw errKelas

      if (kelas) {
        setMyClass(kelas)
        await loadAttendance(kelas.id)
      }
    } catch (err: any) {
      toast.error("Gagal sinkronisasi kelas: " + err.message)
    } finally {
      setFetching(false)
    }
  }

  const loadAttendance = async (classId: string) => {
    setLoading(true)
    try {
      const { data: siswa, error: errSiswa } = await supabase
        .from('profiles')
        .select('id, nama_lengkap')
        .eq('kelas_id', classId)
        .filter('roles', 'cs', '{"Siswa"}')
        .order('nama_lengkap')

      if (errSiswa) throw errSiswa

      const { data: existingData } = await supabase
        .from('absensi_rapor')
        .select('*')
        .in('siswa_id', siswa?.map(s => s.id) || [])

      const map: Record<string, any> = {}
      siswa?.forEach(s => {
        const found = existingData?.find(d => d.siswa_id === s.id)
        map[s.id] = {
          // GACOR: Jika nilai 0 atau null, jadikan string kosong agar placeholder "--" muncul
          sakit: (found?.sakit === 0 || !found?.sakit) ? "" : found.sakit,
          izin: (found?.izin === 0 || !found?.izin) ? "" : found.izin,
          alfa: (found?.alfa === 0 || !found?.alfa) ? "" : found.alfa,
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
        // GACOR: Kembalikan string kosong ke angka 0 saat simpan ke DB
        sakit: val.sakit === "" ? 0 : parseInt(val.sakit),
        izin: val.izin === "" ? 0 : parseInt(val.izin),
        alfa: val.alfa === "" ? 0 : parseInt(val.alfa),
        catatan: val.catatan
      }))

      const { error } = await supabase
        .from('absensi_rapor')
        .upsert(payload, { onConflict: 'siswa_id' })

      if (error) throw error
      toast.success("✅ Rekap Absensi Berhasil Disimpan!")
    } catch (err: any) {
      toast.error("Gagal simpan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  if (!myClass) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 ">
      <AlertCircle className="w-16 h-16 text-amber-500 opacity-20" />
      <h2 className="text-xl font-black uppercase">Anda Bukan Wali Kelas</h2>
      <p className="text-muted-foreground text-sm font-bold max-w-sm uppercase">Hanya Wali Kelas yang dapat mengakses rekap absensi rombel.</p>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 ">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="h-14 w-14 rounded-3xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20">
              <ClipboardList className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">Absensi & Catatan</h1>
              <div className="flex items-center gap-2 mt-2">
                 <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-3  shadow-sm">KELAS {myClass.nama_kelas}</Badge>
                 <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] uppercase px-3 ">Wali Kelas Aktif</Badge>
              </div>
           </div>
        </div>
        
        {students.length > 0 && (
          <Button onClick={handleSaveAll} disabled={loading} className="rounded-2xl font-black h-12 px-10 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase text-[11px] tracking-widest bg-primary text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            SIMPAN SEMUA DATA
          </Button>
        )}
      </div>

      {/* TABLE DATA */}
      <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[3.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="w-12 p-8 text-center font-black text-[10px] uppercase text-muted-foreground ">No</TableHead>
              <TableHead className="w-64 font-black text-[10px] uppercase text-primary ">Nama Lengkap Siswa</TableHead>
              <TableHead className="w-24 text-center font-black text-[10px] uppercase text-red-500 ">Sakit</TableHead>
              <TableHead className="w-24 text-center font-black text-[10px] uppercase text-amber-500 ">Izin</TableHead>
              <TableHead className="w-24 text-center font-black text-[10px] uppercase text-slate-500 ">Alfa</TableHead>
              <TableHead className="font-black text-[10px] uppercase p-6 text-muted-foreground ">Catatan Wali Kelas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((siswa, index) => (
              <TableRow key={siswa.id} className="hover:bg-primary/5 border-border/40 transition-colors">
                <TableCell className="text-center font-black text-muted-foreground/40 ">{index + 1}</TableCell>
                <TableCell className="py-6 font-black text-[11px] uppercase  text-foreground/80">{siswa.nama_lengkap}</TableCell>
                
                {/* INPUT ABSENSI TANPA ANGKA 0 GANGGUAN */}
                {['sakit', 'izin', 'alfa'].map((type) => (
                  <TableCell key={type}>
                    <Input 
                      type="number" 
                      placeholder="--"
                      className="text-center font-black border-none bg-white shadow-inner rounded-xl h-11  text-xs focus:ring-2 focus:ring-primary/20"
                      value={attendanceData[siswa.id]?.[type]}
                      onChange={(e) => setAttendanceData(prev => ({
                        ...prev, 
                        [siswa.id]: { ...(prev[siswa.id] || {}), [type]: e.target.value }
                      }))}
                    />
                  </TableCell>
                ))}

                {/* INPUT CATATAN */}
                <TableCell className="p-4 pr-8">
                  <div className="relative group">
                    <Textarea 
                      placeholder="Pesan perkembangan siswa..."
                      className="min-h-[80px] rounded-[1.5rem] border-none bg-muted/20 text-[11px] font-bold leading-relaxed resize-none focus:bg-white transition-all p-4 shadow-inner "
                      value={attendanceData[siswa.id]?.catatan}
                      onChange={(e) => setAttendanceData(prev => ({
                        ...prev, 
                        [siswa.id]: { ...(prev[siswa.id] || {}), catatan: e.target.value }
                      }))}
                    />
                    <MessageSquare className="absolute right-4 top-4 w-3.5 h-3.5 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-8 bg-primary/5 border-t border-primary/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 ">LENTERA • Homeroom Efficiency System</p>
        </div>
      </Card>
    </div>
  )
}