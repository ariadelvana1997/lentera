"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ChevronLeft, Loader2, Save, User, 
  Search, Users, Info, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"

export default function WaliKelasMappingAnggotaEkskulPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: ekskulId } = use(params)
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [ekskulInfo, setEkskulInfo] = useState<any>(null)
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadData()
  }, [ekskulId])

  const loadData = async () => {
    setFetching(true)
    try {
      // 1. Ambil Info Ekskul
      const { data: ekskul } = await supabase
        .from('ekskul')
        .select('*')
        .eq('id', ekskulId)
        .single()
      setEkskulInfo(ekskul)

      // 2. Ambil Semua Profile Siswa & Relasi Ekskul Lain
      const { data: profiles, error: errProfiles } = await supabase
        .from('profiles')
        .select(`
          id, 
          nama_lengkap, 
          roles,
          kelas:kelas!kelas_id(nama_kelas), 
          ekskul_member:anggota_ekskul(ekskul:ekskul(nama_ekskul))
        `)
      
      if (errProfiles) throw errProfiles

      const siswaList = profiles?.filter((p: any) => {
        const r = Array.isArray(p.roles) ? p.roles.join(' ') : String(p.roles);
        return r.toLowerCase().includes('siswa');
      }) || [];

      // 3. Ambil Anggota Aktif Ekskul ini
      const { data: currentMembers } = await supabase
        .from('anggota_ekskul')
        .select('siswa_id')
        .eq('ekskul_id', ekskulId)

      setAllStudents(siswaList)
      setSelectedIds(currentMembers?.map(m => m.siswa_id) || [])
    } catch (err: any) {
      console.error("Mapping Error:", err.message)
      toast.error("Gagal sinkronisasi data: " + err.message)
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Step A: Bersihkan anggota lama di ekskul ini
      await supabase.from('anggota_ekskul').delete().eq('ekskul_id', ekskulId)

      // Step B: Masukkan list anggota baru (Sat-set!)
      if (selectedIds.length > 0) {
        const payload = selectedIds.map(siswaId => ({
          ekskul_id: ekskulId,
          siswa_id: siswaId
        }))
        const { error } = await supabase.from('anggota_ekskul').insert(payload)
        if (error) throw error
      }

      toast.success("✅ Anggota ekskul berhasil diperbarui!")
    } catch (err: any) {
      toast.error("Waduh, gagal simpan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = allStudents.filter(s => 
    s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredStudents.map(s => s.id))
    }
  }

  if (fetching) return (
    <div className="h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">LENTERA Mapping System...</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700 pb-20 italic">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-border/50 h-11 w-11">
            <Link href="/walikelas/master-penilaian/ekskul"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none italic">Mapping Anggota</h1>
            <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">
              EKSTRAKURIKULER: {ekskulInfo?.nama_ekskul || '...'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="rounded-2xl font-black h-12 px-10 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase text-[11px] tracking-widest">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
          SIMPAN DATABASE ANGGOTA
        </Button>
      </div>

      <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[3rem] overflow-hidden flex flex-col relative">
        {/* TOOLBAR */}
        <div className="p-8 border-b border-border/50 space-y-6 bg-primary/5">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <Input 
                placeholder="Cari nama siswa sultan..." 
                className="pl-12 rounded-2xl h-12 bg-background/60 border-none font-black text-xs shadow-inner italic"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={toggleSelectAll}
              className="rounded-2xl font-black text-[10px] uppercase h-12 border-primary/20 text-primary bg-white shadow-sm px-6"
            >
              {selectedIds.length === filteredStudents.length ? "Batal Semua" : "Pilih Semua Hasil"}
            </Button>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase bg-white/50 p-4 rounded-2xl border border-primary/10 shadow-sm">
            <Info className="w-4 h-4" />
            Total Terpilih: <span className="text-primary underline decoration-2 underline-offset-4">{selectedIds.length} Peserta Didik</span>
          </div>
        </div>

        {/* LIST SISWA */}
        <ScrollArea className="h-[550px]">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.length === 0 ? (
              <div className="col-span-2 text-center py-24">
                 <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                 <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest italic">Siswa tidak ditemukan dalam database</p>
              </div>
            ) : filteredStudents.map((siswa) => {
              const isSelected = selectedIds.includes(siswa.id);
              const otherEkskuls = siswa.ekskul_member?.filter((em: any) => em.ekskul?.nama_ekskul !== ekskulInfo?.nama_ekskul);

              return (
                <label 
                  key={siswa.id} 
                  className={`flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all cursor-pointer group ${isSelected ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" : "border-transparent bg-muted/20 hover:bg-muted/40"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? "bg-primary text-white rotate-6 shadow-lg shadow-primary/30" : "bg-white text-muted-foreground group-hover:bg-primary/10"}`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight leading-none italic">{siswa.nama_lengkap}</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="secondary" className="text-[8px] h-5 rounded-lg uppercase font-black px-2 py-0 bg-white border border-border shadow-sm italic">
                          {siswa.kelas?.nama_kelas || 'NO CLASS'}
                        </Badge>
                        {otherEkskuls?.map((em: any, i: number) => (
                          <Badge key={i} className="bg-amber-100 text-amber-700 border-none text-[8px] h-5 rounded-lg uppercase font-black px-2 py-0 italic">
                            <Sparkles className="w-2.5 h-2.5 mr-1" /> {em.ekskul?.nama_ekskul}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => {
                      setSelectedIds(prev => isSelected ? prev.filter(i => i !== siswa.id) : [...prev, siswa.id])
                    }}
                    className="w-6 h-6 rounded-lg border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </label>
              )
            })}
          </div>
        </ScrollArea>
        
        <div className="p-8 bg-primary/5 border-t border-primary/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 italic">LENTERA • High Fidelity Member Mapping</p>
        </div>
      </Card>
    </div>
  )
}