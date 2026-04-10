"use client"

import { use, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Printer, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CetakIdentitasSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siswaId } = use(params)
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSiswa = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, kelas(nama_kelas)')
        .eq('id', siswaId)
        .single()
      
      setStudent(data)
      setLoading(false)
    }
    fetchSiswa()
  }, [siswaId])

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="bg-white min-h-screen font-serif text-black p-0 md:p-10">
      {/* Kontrol Cetak */}
      <div className="fixed top-5 right-5 flex gap-2 print:hidden">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/admin/cetak-rapor/rapor"><ChevronLeft className="w-4 h-4 mr-2" /> KEMBALI</Link>
        </Button>
        <Button onClick={() => window.print()} className="rounded-full font-black shadow-lg">
          <Printer className="w-4 h-4 mr-2" /> CETAK BIODATA
        </Button>
      </div>

      {/* Kontainer Kertas A4 */}
      <div className="max-w-[21cm] mx-auto bg-white p-[2cm] border print:border-none shadow-sm print:shadow-none min-h-[29.7cm]">
        
        <h2 className="text-center font-bold text-base uppercase mb-10 tracking-widest underline">
          IDENTITAS PESERTA DIDIK
        </h2>

        <div className="space-y-4 text-[12px] leading-relaxed">
          {/* Baris Data */}
          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2">
            <span>1.</span><span>Nama Lengkap Peserta Didik</span><span>:</span>
            <span className="font-bold uppercase">{student?.nama_lengkap || "-"}</span>
          </div>

          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2">
            <span>2.</span><span>NISN / NIS</span><span>:</span>
            <span>{student?.nisn || "-"} / {student?.nis || "-"}</span>
          </div>

          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2">
            <span>3.</span><span>Tempat, Tanggal Lahir</span><span>:</span>
            <span>{student?.tempat_lahir || "-"}, {student?.tanggal_lahir || "-"}</span>
          </div>

          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2">
            <span>4.</span><span>Jenis Kelamin</span><span>:</span>
            <span>{student?.jenis_kelamin || "-"}</span>
          </div>

          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2">
            <span>5.</span><span>Agama</span><span>:</span>
            <span>{student?.agama || "-"}</span>
          </div>

          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2">
            <span>6.</span><span>Alamat Peserta Didik</span><span>:</span>
            <span>{student?.alamat || "-"}</span>
          </div>

          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2">
            <span>7.</span><span>Nama Orang Tua</span><span></span><span></span>
          </div>
          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2 pl-6">
            <span></span><span>a. Ayah</span><span>:</span>
            <span>{student?.nama_ayah || "-"}</span>
          </div>
          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2 pl-6">
            <span></span><span>b. Ibu</span><span>:</span>
            <span>{student?.nama_ibu || "-"}</span>
          </div>

          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2">
            <span>8.</span><span>Pekerjaan Orang Tua</span><span>:</span>
            <span>{student?.pekerjaan_orang_tua || "-"}</span>
          </div>

          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2">
            <span>9.</span><span>Sekolah Asal</span><span>:</span>
            <span>{student?.sekolah_asal || "-"}</span>
          </div>

          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2">
            <span>10.</span><span>Diterima di Sekolah ini</span><span></span><span></span>
          </div>
          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2 pl-6">
            <span></span><span>a. Di Kelas</span><span>:</span>
            <span>{student?.kelas?.nama_kelas || "-"}</span>
          </div>
          <div className="grid grid-cols-[30px_250px_10px_1fr] gap-2 pl-6">
            <span></span><span>b. Pada Tanggal</span><span>:</span>
            <span>14 Juli 2025</span> {/* Statis atau ambil dari created_at */}
          </div>
        </div>

        {/* Bagian Tanda Tangan & Foto */}
        <div className="mt-20 grid grid-cols-2">
          <div className="flex flex-col items-center justify-center">
            <div className="w-[3cm] h-[4cm] border border-black flex items-center justify-center text-[10px] text-gray-400">
              Pas Foto <br /> 3 x 4
            </div>
          </div>
          <div className="text-[12px] space-y-16">
            <div className="text-center">
              <p>Samarinda, 25 Maret 2026</p>
              <p>Kepala Sekolah,</p>
            </div>
            <div className="text-center font-bold">
              <p className="underline uppercase">Maryono, S.Pd</p>
              <p>NIP. 197208042006041014</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}