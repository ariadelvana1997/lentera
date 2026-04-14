"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

export default function CetakBiodataSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = use(params)
  const [fetching, setFetching] = useState(true)
  const [data, setData] = useState<any>(null)
  const [schoolInfo, setSchoolInfo] = useState<any>(null) // Data Pimpinan
  const [config, setConfig] = useState<any>(null); // Data Titimangsa

  useEffect(() => {
    fetchInitialData()
  }, [studentId])

  const fetchInitialData = async () => {
    setFetching(true)
    try {
      // 1. Tarik data profil & detail siswa (Join Table)
      const { data: profile, error: errProfile } = await supabase
        .from('profiles')
        .select(`
          nama_lengkap,
          data_siswa (
            nis, nisn, tempat_lahir, tanggal_lahir, 
            jk, agama, alamat_siswa, 
            nama_ayah, pekerjaan_ayah, 
            nama_ibu, pekerjaan_ibu, 
            nama_wali, pekerjaan_wali
          )
        `)
        .eq('id', studentId)
        .single()

      if (errProfile) throw errProfile
      setData(profile)

      // 2. Tarik data referensi sekolah (Untuk KEPSEK)
      const { data: school } = await supabase
        .from('sekolah')
        .select('*')
        .maybeSingle()
      setSchoolInfo(school)

      // 3. Tarik data dari tabel konfigurasi_rapor (Untuk Titimangsa)
      const { data: configData } = await supabase
        .from('konfigurasi_rapor')
        .select('*')
        .maybeSingle(); 
      
      setConfig(configData);

    } catch (err: any) {
      toast.error("Gagal sinkronisasi data: " + err.message)
    } finally {
      setFetching(false)
    }
  }

  const handlePrint = () => { window.print() }

  if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  const detail = data?.data_siswa || {}

  return (
    <div className="min-h-screen bg-muted/20 pb-20 print:bg-white print:pb-0">
      {/* CSS KHUSUS PRINT: MEMBERSIHKAN HEADER, FOOTER, & SIDEBAR */}
      <style jsx global>{`
        @media print {
          @page { 
            margin: 0; 
          }
          body { 
            margin: 1.6cm; 
            -webkit-print-color-adjust: exact;
          }
          aside, header, nav, footer, .print\:hidden {
            display: none !important;
          }
          .min-h-screen {
            background: white !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Toolbar - Sembunyi saat print */}
      <div className="max-w-[210mm] mx-auto p-6 flex justify-between items-center print:hidden">
        <Button asChild variant="ghost" className="rounded-full gap-2 font-black uppercase text-[10px]">
          <Link href="/admin/cetak-rapor/rapor"><ChevronLeft className="w-4 h-4" /> Kembali</Link>
        </Button>
        <Button onClick={handlePrint} className="rounded-xl font-black gap-2 shadow-lg shadow-primary/20 uppercase text-[10px] bg-primary text-white px-8">
          <Printer className="w-4 h-4" /> CETAK BIODATA (PDF)
        </Button>
      </div>

      {/* AREA KERTAS A4 */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[20mm] min-h-[297mm] print:shadow-none print:p-0 print:mx-0 animate-in fade-in duration-1000 ">
        
        <div className="text-center mb-10">
          <h2 className="text-lg font-bold uppercase tracking-widest leading-tight">KETERANGAN TENTANG DIRI PESERTA DIDIK</h2>
        </div>

        <div className="space-y-4 text-[13px] leading-relaxed">
          <table className="w-full">
            <tbody>
              {/* --- DATA SISWA 1 SAMPAI 10 --- */}
              <tr>
                <td className="w-[5%] align-top py-1.5 font-bold">1.</td>
                <td className="w-[35%] align-top py-1.5 uppercase font-medium">Nama Peserta Didik (Lengkap)</td>
                <td className="w-[2%] align-top py-1.5">:</td>
                <td className="w-[58%] align-top py-1.5 font-black uppercase text-primary">{data?.nama_lengkap || '-'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-bold">2.</td>
                <td className="align-top py-1.5 uppercase font-medium">Nomor Induk / NISN</td>
                <td className="align-top py-1.5">:</td>
                <td className="align-top py-1.5 font-bold uppercase">{detail.nis || '-'} / {detail.nisn || '-'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-bold">3.</td>
                <td className="align-top py-1.5 uppercase font-medium">Tempat, Tanggal Lahir</td>
                <td className="align-top py-1.5">:</td>
                <td className="align-top py-1.5 uppercase">{detail.tempat_lahir || '-'}, {detail.tanggal_lahir || '-'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-bold">4.</td>
                <td className="align-top py-1.5 uppercase font-medium">Jenis Kelamin</td>
                <td className="align-top py-1.5">:</td>
                <td className="align-top py-1.5 uppercase">{detail.jk || '-'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-bold">5.</td>
                <td className="align-top py-1.5 uppercase font-medium">Agama</td>
                <td className="align-top py-1.5">:</td>
                <td className="align-top py-1.5 uppercase">{detail.agama || '-'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-bold">6.</td>
                <td className="align-top py-1.5 uppercase font-medium">Alamat Peserta Didik</td>
                <td className="align-top py-1.5">:</td>
                <td className="align-top py-1.5 uppercase">{detail.alamat_siswa || '-'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-bold">7.</td>
                <td className="align-top py-1.5 uppercase font-medium">Nama Orang Tua</td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td></td>
                <td className="align-top py-1 uppercase pl-4">a. Ayah</td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1 uppercase font-bold">{detail.nama_ayah || '-'}</td>
              </tr>
              <tr>
                <td></td>
                <td className="align-top py-1 uppercase pl-4">b. Ibu</td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1 uppercase font-bold">{detail.nama_ibu || '-'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-bold">8.</td>
                <td className="align-top py-1.5 uppercase font-medium">Pekerjaan Orang Tua</td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td></td>
                <td className="align-top py-1 uppercase pl-4">a. Ayah</td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1 uppercase">{detail.pekerjaan_ayah || '-'}</td>
              </tr>
              <tr>
                <td></td>
                <td className="align-top py-1 uppercase pl-4">b. Ibu</td>
                <td className="align-top py-1">:</td>
                <td className="align-top py-1 uppercase">{detail.pekerjaan_ibu || '-'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-bold">9.</td>
                <td className="align-top py-1.5 uppercase font-medium">Nama Wali</td>
                <td className="align-top py-1.5">:</td>
                <td className="align-top py-1.5 uppercase font-bold">{detail.nama_wali || '-'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-bold">10.</td>
                <td className="align-top py-1.5 uppercase font-medium">Pekerjaan Wali</td>
                <td className="align-top py-1.5">:</td>
                <td className="align-top py-1.5 uppercase">{detail.pekerjaan_wali || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TANDA TANGAN SECTION */}
        <div className="mt-28 flex justify-between items-start px-10">
          <div className="w-32 h-40 border border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-black text-center uppercase">
            Pas Foto <br /> 3 x 4
          </div>
          
          <div className="text-[13px]">
            {/* Sesuai konfigurasi_rapor */}
            <p>
              {config?.lokasi || "Tasikmalaya"}, {config?.tanggal_terbit || "......................... 20..."}
            </p>
            <p className="mt-1 font-medium">Kepala Sekolah,</p>
            <div className="mt-28">
              {/* Bagian KEPSEK & NUPTK tetap sesuai data sekolah */}
              <p className="font-black underline uppercase">
                {schoolInfo?.kepala_sekolah || "DRS. NAMA KEPALA SEKOLAH, M.PD"}
              </p>
              <p className="font-bold">NUPTK. {schoolInfo?.nip_kepala_sekolah || "........................................"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}