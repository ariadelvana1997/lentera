"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  BookOpen, Plus, Search, Loader2, Edit3, 
  Trash2, Target, ChevronLeft, ChevronRight, X, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"

export default function GuruMapelPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [subjects, setSubjects] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // --- STATE TP ---
  const [isTPDialogOpen, setIsTPDialogOpen] = useState(false)
  const [selectedPengampu, setSelectedPengampu] = useState<any>(null)
  const [tpList, setTpList] = useState<any[]>([])
  const [tpFormData, setTpFormData] = useState({ kode_tp: "", deskripsi_tp: "" })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        fetchData(user.id)
      }
    }
    init()
  }, [])

  const fetchData = async (idGuru: string) => {
    setFetching(true)
    try {
      // Mengambil Mapel dengan filter guru yang sedang login saja
      const { data: mapel } = await supabase
        .from('mata_pelajaran')
        .select(`
          *,
          mapel_pengampu!inner (
            id, kktp, tingkat, guru_id, kelas_id,
            kelas:kelas(nama_kelas),
            guru:profiles!guru_id(nama_lengkap),
            tp_count:tujuan_pembelajaran(count)
          )
        `)
        .eq('mapel_pengampu.guru_id', idGuru)
        .order('nama_mapel', { ascending: true })

      if (mapel) setSubjects(mapel)
    } finally {
      setFetching(false)
    }
  }

  // --- LOGIKA FILTER & PAGINATION ---
  const filteredData = subjects.filter(s => 
    s.nama_mapel?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // --- LOGIKA TP (Tujuan Pembelajaran) ---
  const handleOpenTP = async (p: any) => {
    setSelectedPengampu(p)
    setIsTPDialogOpen(true)
    fetchTP(p.id)
  }

  const fetchTP = async (pengampuId: string) => {
    const { data } = await supabase
      .from('tujuan_pembelajaran')
      .select('*')
      .eq('pengampu_id', pengampuId)
      .order('created_at', { ascending: true })
    if (data) setTpList(data)
  }

  const handleAddTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('tujuan_pembelajaran').insert([{
        pengampu_id: selectedPengampu.id, 
        kode_tp: tpFormData.kode_tp, 
        deskripsi_tp: tpFormData.deskripsi_tp
      }])
      if (error) throw error
      setTpFormData({ kode_tp: "", deskripsi_tp: "" })
      fetchTP(selectedPengampu.id)
      if (userId) fetchData(userId)
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleDeleteTP = async (id: string) => {
    await supabase.from('tujuan_pembelajaran').delete().eq('id', id)
    fetchTP(selectedPengampu.id)
    if (userId) fetchData(userId)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 uppercase">
            <BookOpen className="w-8 h-8 text-primary" /> Mapel Diampu
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">
            Daftar mata pelajaran yang anda ajar
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl flex items-center gap-2 border border-primary/20">
           <Info className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-wider">Kelola TP di tombol Aksi</span>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Mata Pelajaran..." 
              className="pl-12 rounded-2xl h-11 bg-muted/30 border-none font-bold"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest font-bold">
            Total {filteredData.length} Mapel
          </span>
        </div>

        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-none">
              <TableHead className="font-black text-[10px] uppercase pl-8">Mata Pelajaran</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Daftar Kelas</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">KKTP</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">Tujuan Pembelajaran (TP)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : currentData.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="p-10 text-center text-muted-foreground font-bold ">Anda belum memiliki jadwal mengajar.</TableCell></TableRow>
            ) : currentData.map((mapel) => (
              <TableRow key={mapel.id} className="hover:bg-muted/5 transition-colors border-border/50 align-top">
                <TableCell className="py-8 pl-8">
                  <div className="text-[9px] font-black text-muted-foreground uppercase mb-1 tracking-tighter">MAPEL ID: {mapel.id.split('-')[0]}</div>
                  <div className="font-black text-lg text-primary uppercase leading-none">{mapel.nama_mapel}</div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-4">
                    {mapel.mapel_pengampu?.map((p: any) => (
                      <div key={p.id} className="flex flex-col border-l-2 border-primary/20 pl-3 py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="rounded-lg text-[10px] font-black h-6 px-3 bg-primary/5 text-primary border-primary/10">
                            {p.kelas?.nama_kelas}
                          </Badge>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ">Tingkat {p.tingkat}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center py-4">
                  <div className="space-y-4">
                    {mapel.mapel_pengampu?.map((p: any) => (
                      <div key={p.id} className="h-6 flex items-center justify-center">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[11px] h-6">{p.kktp}</Badge>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center py-4">
                  <div className="space-y-4">
                    {mapel.mapel_pengampu?.map((p: any) => (
                      <div key={p.id} className="h-6 flex items-center justify-center">
                         <Button 
                            onClick={() => handleOpenTP({...p, mapel})} 
                            variant="outline" 
                            size="sm" 
                            className="h-8 gap-2 text-[10px] font-black hover:bg-primary hover:text-white transition-all rounded-xl border-primary/20 px-4"
                          >
                            <Target className="w-3 h-3" /> 
                            {p.tp_count?.[0]?.count || 0} TP TERDAFTAR
                         </Button>
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-6 border-t border-border/50 flex items-center justify-between">
          <div className="flex gap-1">
             <Button variant="ghost" size="icon" className="rounded-xl" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
               <ChevronLeft className="w-4 h-4"/>
             </Button>
             <Button variant="ghost" size="icon" className="rounded-xl" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>
               <ChevronRight className="w-4 h-4"/>
             </Button>
          </div>
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ">
            LENTERA • Halaman {currentPage} Dari {totalPages || 1}
          </span>
        </div>
      </Card>

      {/* DIALOG MANAJEMEN TP (Sama dengan Admin tapi akses dibatasi ke Mapel guru sendiri) */}
      <Dialog open={isTPDialogOpen} onOpenChange={setIsTPDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl ">
          <DialogHeader className="p-8 pb-4">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase">Tujuan Pembelajaran</DialogTitle>
            <DialogDescription className="font-bold text-xs">
              Mapel: <span className="text-primary">{selectedPengampu?.mapel?.nama_mapel}</span> • Kelas {selectedPengampu?.kelas?.nama_kelas}
            </DialogDescription>
          </DialogHeader>

          <div className="px-8 pb-6">
            <form onSubmit={handleAddTP} className="flex gap-3 items-end bg-muted/30 p-4 rounded-[2rem]">
              <div className="w-24 shrink-0">
                <Label className="text-[9px] uppercase font-black ml-1 mb-2 block">Kode TP</Label>
                <Input placeholder="TP 1" value={tpFormData.kode_tp} onChange={e => setTpFormData({...tpFormData, kode_tp: e.target.value})} className="rounded-xl border-none bg-background h-11 text-xs font-black uppercase text-center" required />
              </div>
              <div className="flex-1">
                <Label className="text-[9px] uppercase font-black ml-1 mb-2 block">Deskripsi Tujuan Pembelajaran</Label>
                <Input placeholder="Contoh: Peserta didik mampu menjelaskan..." value={tpFormData.deskripsi_tp} onChange={e => setTpFormData({...tpFormData, deskripsi_tp: e.target.value})} className="rounded-xl border-none bg-background h-11 text-xs font-bold" required />
              </div>
              <Button type="submit" disabled={loading} className="rounded-xl h-11 w-11 p-0 shadow-lg shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-6 h-6" />}
              </Button>
            </form>
          </div>

          <ScrollArea className="flex-1 px-8 py-4">
            <div className="space-y-4 pb-10">
              {tpList.length === 0 ? (
                <div className="text-center py-20 opacity-20">
                   <Target className="w-20 h-20 mx-auto mb-4" />
                   <p className="text-sm font-black uppercase tracking-widest">Belum ada TP terdaftar</p>
                </div>
              ) : (
                tpList.map((tp, index) => (
                  <div key={tp.id} className="group flex items-start gap-4 p-5 bg-card/50 rounded-[2rem] border border-border/40 hover:border-primary/40 transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs shrink-0 ">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="rounded-lg text-[9px] font-black h-5 bg-primary/10 text-primary border-none">{tp.kode_tp}</Badge>
                      </div>
                      <p className="text-sm font-bold leading-relaxed">{tp.deskripsi_tp}</p>
                    </div>
                    <Button 
                      onClick={() => handleDeleteTP(tp.id)} 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-6 bg-primary/5 border-t border-primary/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary ">LENTERA • Total {tpList.length} TP Terdaftar</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}