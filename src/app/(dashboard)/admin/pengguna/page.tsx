"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { registerUserAction } from "@/app/actions/register-user" 
import { 
  Search, UserPlus, Edit2, Trash2, Loader2, 
  ChevronLeft, ChevronRight, Rocket, Trash, CheckCircle2,
  RefreshCw // Tambahan icon untuk acak ulang
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"

const ROLE_OPTIONS = [
  { id: "Admin", label: "Admin" },
  { id: "Walikelas", label: "Walikelas" },
  { id: "Guru", label: "Guru" },
  { id: "Siswa", label: "Siswa" },
  { id: "Pembina Ko-Kurikuler", label: "Pembina Ko-Kurikuler" },
]

export default function PenggunaPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    roles: [] as string[]
  })

  // --- HELPER: GENERATE EMAIL INSTITUSI (5 DIGIT) ---
  const generateInstitutionalEmail = () => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
    return `${randomDigits}@lentera.app`;
  };

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setUsers(data)
      if (error) throw error
    } catch (err: any) {
      console.error("Fetch error:", err.message)
    } finally {
      setFetching(false)
    }
  }

  const getFilteredUsers = (roleFilter: string) => {
    return users.filter(user => {
      const matchesRole = roleFilter === "Semua" || user.roles?.includes(roleFilter)
      const matchesSearch = 
        user.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesRole && matchesSearch
    })
  }

  const handleSelectAll = (currentUsers: any[]) => {
    if (selectedIds.length === currentUsers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentUsers.map(u => u.id))
    }
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleDeleteBulk = async () => {
    if (confirm(`Hapus ${selectedIds.length} pengguna terpilih secara permanen?`)) {
      setLoading(true)
      try {
        const { error } = await supabase.from('profiles').delete().in('id', selectedIds)
        if (error) throw error
        alert("Data berhasil dihapus!")
        setSelectedIds([])
        fetchUsers()
      } catch (err: any) {
        alert("Gagal menghapus: " + err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleAutopilot = (user: any) => {
    alert(`Mode Autopilot Aktif: Menyamar sebagai ${user.nama_lengkap} (${user.roles?.[0] || 'User'})`)
    const target = user.roles?.[0]?.toLowerCase() || "dashboard"
    window.open(`/${target}?autopilot=${user.id}`, "_blank")
  }

  const handleRoleToggle = (roleId: string) => {
    setFormData((prev) => {
      const isSelected = prev.roles.includes(roleId)
      const updatedRoles = isSelected
        ? prev.roles.filter((r) => r !== roleId)
        : [...prev.roles, roleId]
      return { ...prev, roles: updatedRoles }
    })
  }

  const handleEdit = (user: any) => {
    setIsEditMode(true)
    setSelectedId(user.id)
    setFormData({
      nama: user.nama_lengkap || "",
      email: user.email || "",
      password: "", 
      roles: user.roles || []
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Hapus pengguna ini secara permanen?")) {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (!error) fetchUsers()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('profiles')
          .update({ nama_lengkap: formData.nama, roles: formData.roles })
          .eq('id', selectedId)
        if (error) throw error
        alert("Data berhasil diperbarui!")
      } else {
        const result = await registerUserAction(formData)
        if (!result.success) throw new Error(result.message)
        alert("Pengguna baru berhasil terdaftar!")
      }
      setIsDialogOpen(false)
      fetchUsers()
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Master Pengguna</h1>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest leading-none mt-1">
            Kelola data login dan hak akses LENTERA.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button onClick={handleDeleteBulk} variant="destructive" className="rounded-xl h-11 gap-2 font-bold animate-in slide-in-from-right">
              <Trash className="w-4 h-4" />
              Hapus ({selectedIds.length})
            </Button>
          )}
          <Button 
            onClick={() => { 
              setIsEditMode(false); 
              // --- GENERATE EMAIL OTOMATIS SAAT TAMBAH ---
              const autoEmail = generateInstitutionalEmail();
              setFormData({nama:"", email: autoEmail, password:"", roles:[]}); 
              setIsDialogOpen(true); 
            }} 
            className="rounded-xl h-11 gap-2 font-bold shadow-lg shadow-primary/20 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pengguna
          </Button>
        </div>
      </div>

      <Tabs defaultValue="Semua" className="w-full space-y-6" onValueChange={() => setCurrentPage(1)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-muted/50 p-1 rounded-2xl border w-fit">
            {["Semua", "Admin", "Guru", "Siswa"].map(tab => (
              <TabsTrigger key={tab} value={tab} className="rounded-xl px-6 font-bold text-xs uppercase tracking-tighter">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input 
              type="text"
              placeholder="Cari nama atau email..." 
              className="w-full pl-12 rounded-2xl h-11 bg-card/50 border-none shadow-inner focus-visible:outline-none focus:ring-1 focus:ring-primary transition-all text-sm font-bold"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {["Semua", "Admin", "Guru", "Siswa"].map(tabValue => {
          const filteredData = getFilteredUsers(tabValue)
          const totalPages = Math.ceil(filteredData.length / itemsPerPage)
          const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

          return (
            <TabsContent key={tabValue} value={tabValue} className="m-0 focus-visible:outline-none space-y-4">
              <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="w-12 p-6">
                          <Checkbox 
                            checked={selectedIds.length === currentData.length && currentData.length > 0}
                            onCheckedChange={() => handleSelectAll(currentData)}
                          />
                        </TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Pengguna</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Hak Akses</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Dibuat</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest p-6 text-muted-foreground">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fetching ? (
                        <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                      ) : currentData.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-bold uppercase text-[10px]  tracking-widest">Tidak ada data ditemukan.</TableCell></TableRow>
                      ) : (
                        currentData.map((user) => (
                          <TableRow key={user.id} className={`hover:bg-muted/10 transition-colors border-border/50 ${selectedIds.includes(user.id) ? "bg-primary/5" : ""}`}>
                            <TableCell className="p-6">
                              <Checkbox 
                                checked={selectedIds.includes(user.id)}
                                onCheckedChange={() => handleSelectOne(user.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                                  {user.nama_lengkap?.charAt(0) || "U"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black text-sm truncate leading-none uppercase ">{user.nama_lengkap}</p>
                                  <p className="text-[10px] text-muted-foreground mt-2 truncate font-mono">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1.5">
                                {user.roles?.map((r: string) => (
                                  <Badge key={r} variant="secondary" className="text-[9px] font-black rounded-lg px-2 py-0.5 border-none bg-primary/10 text-primary uppercase">
                                    {r}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-[10px] text-muted-foreground font-black uppercase">
                              {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="text-right p-6">
                              <div className="flex justify-end gap-1">
                                <Button onClick={() => handleAutopilot(user)} variant="ghost" size="icon" className="rounded-xl hover:bg-amber-500/10 hover:text-amber-600" title="Autopilot">
                                  <Rocket className="w-4 h-4 fill-current" />
                                </Button>
                                <Button onClick={() => handleEdit(user)} variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10">
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button onClick={() => handleDelete(user.id)} variant="ghost" size="icon" className="rounded-xl hover:bg-red-50 hover:text-red-500">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {!fetching && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-muted/20 rounded-3xl border border-border/50">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" size="icon" className="rounded-xl h-9 w-9" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" size="icon" className="rounded-xl h-9 w-9" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden focus-visible:outline-none bg-white/95 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter uppercase ">{isEditMode ? "Edit Pengguna" : "Registrasi Baru"}</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase text-muted-foreground">Pastikan data yang diinput sudah sesuai dengan identitas asli.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nama Lengkap</Label>
                <Input value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1 font-bold text-sm" required />
              </div>
              
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                  Email Institusi (Otomatis)
                  {!isEditMode && (
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, email: generateInstitutionalEmail()})}
                      className="text-primary hover:underline flex items-center gap-1 font-black"
                    >
                      <RefreshCw className="w-3 h-3" /> ACAK ULANG
                    </button>
                  )}
                </Label>
                <Input 
                  type="email" 
                  value={formData.email} 
                  readOnly={!isEditMode}
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className={`rounded-xl h-12 border-none focus-visible:ring-1 font-mono text-sm ${!isEditMode ? 'bg-primary/5 text-primary font-bold' : 'bg-muted/30'}`} 
                  disabled={isEditMode} 
                  required 
                />
              </div>

              {!isEditMode && (
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kata Sandi</Label>
                  <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" required />
                </div>
              )}
              
              <div className="space-y-3 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pilih Hak Akses</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((role) => {
                    const active = formData.roles.includes(role.id);
                    return (
                      <label 
                        key={role.id} 
                        className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                          active ? "bg-primary/5 border-primary shadow-sm" : "border-border/50 hover:bg-muted"
                        }`}
                      >
                        <Checkbox 
                          id={role.id}
                          checked={active}
                          onCheckedChange={() => handleRoleToggle(role.id)}
                        />
                        <span className="text-[10px] font-black leading-none flex-1 py-1 uppercase ">
                          {role.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-xl font-black text-xs shadow-lg shadow-primary/20 uppercase tracking-widest" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Simpan Data Pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}