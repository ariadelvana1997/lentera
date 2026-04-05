"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Users, Edit3, Loader2, Search, 
  UserCheck, ClipboardEdit, GraduationCap 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function GuruReferensiPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [teachers, setTeachers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)

  const [formData, setFormData] = useState({
    nuptk: "",
    jk: "",
    jenis_ptk: "",
  })

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    setFetching(true)
    try {
      // Kita ambil user dari PROFILES yang rolenya ada 'Guru'
      // Dan gabungkan (join) dengan tabel DATA_GURU
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          nama_lengkap,
          roles,
          data_guru (
            nuptk,
            jk,
            jenis_ptk
          )
        `)
        .contains('roles', ['Guru']) // Filter hanya yang punya role Guru
        .ilike('nama_lengkap', `%${searchQuery}%`)

      if (data) setTeachers(data)
      if (error) throw error
    } catch (err: any) {
      console.error(err.message)
    } finally {
      setFetching(false)
    }
  }

  const handleEditClick = (teacher: any) => {
    setSelectedTeacher(teacher)
    setFormData({
      nuptk: teacher.data_guru?.nuptk || "",
      jk: teacher.data_guru?.jk || "",
      jenis_ptk: teacher.data_guru?.jenis_ptk || "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('data_guru')
        .upsert({
          id: selectedTeacher.id,
          ...formData,
          updated_at: new Date()
        })

      if (error) throw error
      alert("✅ Data guru berhasil diperbarui!")
      setIsDialogOpen(false)
      fetchTeachers()
    } catch (err: any) {
      alert("❌ Gagal: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            Data Referensi Guru
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">Sinkronisasi otomatis dengan akun Pengguna ber-role Guru.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama guru..." 
              className="pl-12 rounded-2xl h-11 bg-muted/30 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTeachers()}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-16 p-6 text-center font-black text-[10px] uppercase">No</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Nama Guru</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">NUPTK</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">JK</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Jenis PTK</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest p-6 text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : teachers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-medium">Data guru tidak ditemukan. Pastikan sudah ada Pengguna dengan Role 'Guru'.</TableCell></TableRow>
            ) : (
              teachers.map((teacher, index) => (
                <TableRow key={teacher.id} className="hover:bg-muted/10 transition-colors border-border/50">
                  <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-bold text-sm">{teacher.nama_lengkap}</TableCell>
                  <TableCell className="text-sm font-medium">{teacher.data_guru?.nuptk || "-"}</TableCell>
                  <TableCell className="text-sm">{teacher.data_guru?.jk || "-"}</TableCell>
                  <TableCell className="text-sm">{teacher.data_guru?.jenis_ptk || "-"}</TableCell>
                  <TableCell className="text-right p-6">
                    <Button 
                      onClick={() => handleEditClick(teacher)}
                      className="rounded-xl gap-2 font-bold text-xs h-9"
                      variant={teacher.data_guru ? "outline" : "default"}
                    >
                      {teacher.data_guru ? <Edit3 className="w-3 h-3" /> : <ClipboardEdit className="w-3 h-3" />}
                      {teacher.data_guru ? "Edit" : "Lengkapi"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog Lengkapi Data */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-8 border-none shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Lengkapi Data Guru</DialogTitle>
              <DialogDescription>Nama: <span className="text-foreground font-bold">{selectedTeacher?.nama_lengkap}</span></DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">NUPTK</Label>
                <Input 
                  placeholder="Masukkan 16 digit NUPTK" 
                  value={formData.nuptk}
                  onChange={(e) => setFormData({...formData, nuptk: e.target.value})}
                  className="rounded-xl h-12 bg-muted/30 border-none" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Jenis Kelamin</Label>
                <Select value={formData.jk} onValueChange={(val) => setFormData({...formData, jk: val})}>
                  <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none">
                    <SelectValue placeholder="Pilih JK" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Jenis PTK</Label>
                <Select value={formData.jenis_ptk} onValueChange={(val) => setFormData({...formData, jenis_ptk: val})}>
                  <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-none">
                    <SelectValue placeholder="Pilih Jenis PTK" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="Guru Mapel">Guru Mapel</SelectItem>
                    <SelectItem value="Guru Kelas">Guru Kelas</SelectItem>
                    <SelectItem value="Guru BK">Guru BK</SelectItem>
                    <SelectItem value="Guru Inklusi">Guru Inklusi</SelectItem>
                    <SelectItem value="Tenaga Kependidikan">Tenaga Kependidikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-xl font-black" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Data Guru"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}