"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ChevronLeft, Loader2, Save, User, 
  Search, Users, CheckSquare, Square, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"

export default function MappingAnggotaEkskulPage({ params }: { params: Promise<{ id: string }> }) {
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

      // 2. Ambil Semua Profile & Relasi (DIPERBAIKI DISINI)
      const { data: profiles, error: errProfiles } = await supabase
        .from('profiles')
        .select(`
          id, 
          nama_lengkap, 
          roles,
          kelas:kelas!kelas_id(nama_kelas), 
          ekskul_member:anggota_ekskul(ekskul:ekskul(nama_ekskul))
        `)
      
      // Penjelasan: kelas:kelas!kelas_id artinya "Gunakan Foreign Key kelas_id untuk relasi ini"
      
      if (errProfiles) {
        console.error("DEBUG ERROR PROFILES:", errProfiles.message);
        toast.error("Gagal memuat profil: " + errProfiles.message);
      }

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
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Step A: Hapus anggota lama
      await supabase.from('anggota_ekskul').delete().eq('ekskul_id', ekskulId)

      // Step B: Insert anggota baru
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
      toast.error("Gagal menyimpan: " + err.message)
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

  if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
            <Link href="/admin/penilaian/ekskul"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none">Mapping Anggota</h1>
            <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1 ">
              Ekskul: {ekskulInfo?.nama_ekskul || '...'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="rounded-xl font-black h-11 px-8 shadow-lg shadow-primary/20">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
          SIMPAN ANGGOTA
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden flex flex-col">
        <div className="p-8 border-b border-border/50 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama siswa..." 
                className="pl-12 rounded-2xl h-11 bg-muted/30 border-none font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={toggleSelectAll}
              className="rounded-xl font-black text-[10px] uppercase h-11 border-primary/20 text-primary"
            >
              {selectedIds.length === filteredStudents.length ? "Batal Semua" : "Pilih Semua Hasil"}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase bg-primary/5 p-3 rounded-xl border border-primary/10">
            <Info className="w-3.5 h-3.5 text-primary" />
            Terpilih: <span className="text-primary">{selectedIds.length} Siswa</span>
          </div>
        </div>

        <ScrollArea className="h-[550px]">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredStudents.length === 0 ? (
              <div className="col-span-2 text-center py-20 text-muted-foreground  font-bold uppercase text-xs">Siswa tidak ditemukan</div>
            ) : filteredStudents.map((siswa) => {
              const isSelected = selectedIds.includes(siswa.id);
              const otherEkskuls = siswa.ekskul_member?.filter((em: any) => em.ekskul?.nama_ekskul !== ekskulInfo?.nama_ekskul);

              return (
                <label 
                  key={siswa.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${isSelected ? "bg-primary/5 border-primary shadow-sm" : "border-transparent hover:bg-muted/40"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10"}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight leading-none">{siswa.nama_lengkap}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary" className="text-[8px] h-4 rounded-md uppercase font-bold px-1.5 py-0">
                          {siswa.kelas?.nama_kelas || 'No Class'}
                        </Badge>
                        {otherEkskuls?.map((em: any, i: number) => (
                          <Badge key={i} className="bg-amber-100 text-amber-700 border-none text-[8px] h-4 rounded-md uppercase font-bold px-1.5 py-0">
                            {em.ekskul?.nama_ekskul}
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
                    className="w-5 h-5 rounded-md border-2"
                  />
                </label>
              )
            })}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}