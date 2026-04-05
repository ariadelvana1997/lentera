"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  School, Save, Loader2, MapPin, 
  User, Globe, Mail, Phone, Info, Award 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

export default function SekolahPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    nama_sekolah: "",
    npsn: "",
    nss: "",
    alamat: "",
    kode_pos: "",
    telepon: "",
    email: "",
    website: "",
    kepala_sekolah: "",
    nip_kepala_sekolah: "",
    akreditasi: ""
  })

  useEffect(() => {
    fetchSchoolData()
  }, [])

  const fetchSchoolData = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('sekolah')
        .select('*')
        .eq('id', 1)
        .single()
      
      if (data) setFormData(data)
      if (error && error.code !== 'PGRST116') throw error
    } catch (err: any) {
      console.error("Fetch error:", err.message)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('sekolah')
        .upsert({ id: 1, ...formData, updated_at: new Date() })
      
      if (error) throw error
      alert("✅ Identitas sekolah berhasil diperbarui!")
    } catch (err: any) {
      alert("❌ Gagal menyimpan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <School className="w-6 h-6 text-primary" />
            </div>
            Identitas Sekolah
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Informasi dasar institusi yang akan tampil di dokumen resmi.</p>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="rounded-xl h-12 px-8 gap-2 font-black shadow-lg shadow-primary/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Perubahan
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Informasi Umum */}
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-md rounded-[2rem] p-4">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Informasi Umum</h2>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Nama Sekolah</Label>
              <Input 
                value={formData.nama_sekolah} 
                onChange={(e) => setFormData({...formData, nama_sekolah: e.target.value})}
                className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
                placeholder="SMK Negeri 1..."
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">NPSN</Label>
                <Input 
                  value={formData.npsn} 
                  onChange={(e) => setFormData({...formData, npsn: e.target.value})}
                  className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Akreditasi</Label>
                <Input 
                  value={formData.akreditasi} 
                  onChange={(e) => setFormData({...formData, akreditasi: e.target.value})}
                  className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
                  placeholder="A, B, C..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">NSS / NDS</Label>
              <Input 
                value={formData.nss} 
                onChange={(e) => setFormData({...formData, nss: e.target.value})}
                className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Pimpinan Sekolah */}
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-md rounded-[2rem] p-4 h-fit">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Pimpinan Sekolah</h2>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Kepala Sekolah</Label>
              <Input 
                value={formData.kepala_sekolah} 
                onChange={(e) => setFormData({...formData, kepala_sekolah: e.target.value})}
                className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
                placeholder="Nama Lengkap & Gelar"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">NIP Kepala Sekolah</Label>
              <Input 
                value={formData.nip_kepala_sekolah} 
                onChange={(e) => setFormData({...formData, nip_kepala_sekolah: e.target.value})}
                className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Kontak & Alamat */}
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-md rounded-[2rem] p-4 md:col-span-2">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Lokasi</h2>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Alamat Lengkap</Label>
                <Textarea 
                  value={formData.alamat} 
                  onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  className="rounded-2xl bg-muted/30 border-none focus-visible:ring-1 min-h-[100px]" 
                  placeholder="Jalan, Desa, Kecamatan..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Kode Pos</Label>
                <Input 
                  value={formData.kode_pos} 
                  onChange={(e) => setFormData({...formData, kode_pos: e.target.value})}
                  className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Kontak & Digital</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">No. Telepon</Label>
                  <Input 
                    value={formData.telepon} 
                    onChange={(e) => setFormData({...formData, telepon: e.target.value})}
                    className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email Sekolah</Label>
                  <Input 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Website Resmi</Label>
                <Input 
                  value={formData.website} 
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-1" 
                  placeholder="https://www.sekolah.sch.id"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}