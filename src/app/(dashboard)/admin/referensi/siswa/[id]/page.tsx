"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { 
  ChevronLeft, Loader2, Save, Fingerprint, 
  Users, MapPin, Sparkles 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select"
import Link from "next/link"
import { toast } from "sonner"

export default function EditDetailSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = use(params)
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [classList, setClassList] = useState<any[]>([])

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nis: "",
    nisn: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    agama: "",
    alamat: "",
    nama_ayah: "",
    nama_ibu: "",
    pekerjaan_ayah: "",
    pekerjaan_ibu: "",
    nama_wali: "",
    pekerjaan_wali: "",
    kelas_id: ""
  })

  useEffect(() => {
    loadData()
  }, [studentId])

  const loadData = async () => {
    setFetching(true)
    try {
      const { data: kelas } = await supabase.from('kelas').select('*').order('nama_kelas')
      setClassList(kelas || [])

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single()

      if (profile) {
        setFormData({
          nama_lengkap: profile.nama_lengkap || "",
          nis: profile.nis || "",
          nisn: profile.nisn || "",
          tempat_lahir: profile.tempat_lahir || "",
          tanggal_lahir: profile.tanggal_lahir || "",
          jenis_kelamin: profile.jenis_kelamin || "",
          agama: profile.agama || "",
          alamat: profile.alamat || "",
          nama_ayah: profile.nama_ayah || "",
          nama_ibu: profile.nama_ibu || "",
          pekerjaan_ayah: profile.pekerjaan_ayah || "",
          pekerjaan_ibu: profile.pekerjaan_ibu || "",
          nama_wali: profile.nama_wali || "",
          pekerjaan_wali: profile.pekerjaan_wali || "",
          kelas_id: profile.kelas_id || ""
        })
      }
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from('profiles').update(formData).eq('id', studentId)
      if (error) throw error
      toast.success("✅ Master Data Siswa Berhasil Disinkronkan!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700 pb-20 italic">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full bg-white shadow-sm h-11 w-11">
            <Link href="/admin/referensi/siswa"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-2xl font-black uppercase italic">Edit Identitas Master</h1>
        </div>
        <Button onClick={handleSave} disabled={loading} className="rounded-2xl font-black h-12 px-10 shadow-xl shadow-primary/20 uppercase text-[11px] tracking-widest">
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} SIMPAN DATA
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-card/40 backdrop-blur-sm rounded-[3rem] p-8 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4"><Fingerprint className="text-primary" /><span className="font-black uppercase text-sm">Informasi Personal</span></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[9px] font-black uppercase opacity-40">Nama Lengkap</label><Input value={formData.nama_lengkap} onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})} className="rounded-xl border-none shadow-inner italic font-bold uppercase" /></div>
            <div className="space-y-1"><label className="text-[9px] font-black uppercase opacity-40">Kelas</label>
              <Select value={formData.kelas_id} onValueChange={(v) => setFormData({...formData, kelas_id: v})}>
                <SelectTrigger className="rounded-xl border-none shadow-inner italic font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>{classList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><label className="text-[9px] font-black uppercase opacity-40">NIS</label><Input value={formData.nis} onChange={(e) => setFormData({...formData, nis: e.target.value})} className="rounded-xl border-none shadow-inner italic font-bold" /></div>
            <div className="space-y-1"><label className="text-[9px] font-black uppercase opacity-40">NISN</label><Input value={formData.nisn} onChange={(e) => setFormData({...formData, nisn: e.target.value})} className="rounded-xl border-none shadow-inner italic font-bold" /></div>
          </div>
          <div className="space-y-1"><label className="text-[9px] font-black uppercase opacity-40">Alamat Lengkap</label><Textarea value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} className="rounded-2xl border-none shadow-inner italic font-bold min-h-[100px]" /></div>
        </Card>

        <Card className="border-none shadow-2xl bg-primary/5 rounded-[3rem] p-8 space-y-6 border-l-8 border-l-primary">
          <div className="flex items-center gap-3 border-b border-primary/10 pb-4"><Users className="text-primary" /><span className="font-black uppercase text-sm text-primary">Keluarga</span></div>
          <div className="space-y-4">
            <div className="space-y-1"><label className="text-[8px] font-black uppercase opacity-40">Ayah</label><Input value={formData.nama_ayah} onChange={(e) => setFormData({...formData, nama_ayah: e.target.value})} className="rounded-lg border-none shadow-sm italic font-bold text-xs uppercase" /></div>
            <div className="space-y-1"><label className="text-[8px] font-black uppercase opacity-40">Ibu</label><Input value={formData.nama_ibu} onChange={(e) => setFormData({...formData, nama_ibu: e.target.value})} className="rounded-lg border-none shadow-sm italic font-bold text-xs uppercase" /></div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-primary/10 flex gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[9px] font-black uppercase leading-tight text-primary/70">Data ini otomatis muncul di Cetak Biodata PDF.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}