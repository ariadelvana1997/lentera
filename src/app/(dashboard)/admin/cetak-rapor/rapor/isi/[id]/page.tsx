"use client"

import { use, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrintIsiRaporPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siswaId } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Ambil data siswa & kelas 
      const { data: siswa } = await supabase
        .from('profiles')
        .select('*, kelas(*)')
        .eq('id', siswaId)
        .single()

      // Ambil nilai akademik & capaian 
      const { data: nilai } = await supabase
        .from('nilai_akademik')
        .select('*, mapel_pengampu(mata_pelajaran(nama_mapel))')
        .eq('siswa_id', siswaId)

      // Ambil absensi 
      const { data: absen } = await supabase
        .from('absensi_rapor')
        .select('*')
        .eq('siswa_id', siswaId)
        .single()

      setData({ siswa, nilai, absen })
      setLoading(false)
    }
    fetchData()
  }, [siswaId])

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="bg-white min-h-screen p-0 md:p-10 font-serif text-black leading-relaxed">
      {/* Tombol Print (Sembunyi saat dicetak) */}
      <div className="fixed top-5 right-5 print:hidden">
        <Button onClick={() => window.print()} className="rounded-full shadow-2xl font-black">
          <Printer className="mr-2" /> CETAK SEKARANG
        </Button>
      </div>

      <div className="max-w-[21cm] mx-auto bg-white p-[1.5cm] border print:border-none shadow-sm print:shadow-none">
        
        {/* HEADER IDENTITAS  */}
        <div className="grid grid-cols-2 text-[11px] mb-6">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32">Nama Siswa</span>
              <span className="mr-2">:</span>
              <span className="font-bold uppercase">{data.siswa?.nama_lengkap}</span>
            </div>
            <div className="flex">
              <span className="w-32">NISN</span>
              <span className="mr-2">:</span>
              <span>{data.siswa?.nisn || "-"}</span>
            </div>
            <div className="flex">
              <span className="w-32">Sekolah</span>
              <span className="mr-2">:</span>
              <span>SMK NEGERI 5 SAMARINDA</span> {/*  */}
            </div>
          </div>
          <div className="space-y-1 ml-auto">
            <div className="flex">
              <span className="w-32">Kelas</span>
              <span className="mr-2">:</span>
              <span>{data.siswa?.kelas?.nama_kelas}</span>
            </div>
            <div className="flex">
              <span className="w-32">Semester</span>
              <span className="mr-2">:</span>
              <span>1</span> {/* [cite: 2] */}
            </div>
            <div className="flex">
              <span className="w-32">Tahun Ajaran</span>
              <span className="mr-2">:</span>
              <span>2025/2026</span> {/* [cite: 2] */}
            </div>
          </div>
        </div>

        <h2 className="text-center font-bold text-sm uppercase mb-6 tracking-widest">Laporan Hasil Belajar</h2>

        {/* TABEL NILAI  */}
        <table className="w-full border-collapse border border-black text-[10px] mb-6">
          <thead>
            <tr className="bg-gray-100 font-bold uppercase">
              <th className="border border-black p-2 w-8">No</th>
              <th className="border border-black p-2 text-left">Mata Pelajaran</th>
              <th className="border border-black p-2 w-20">Nilai Akhir</th>
              <th className="border border-black p-2">Capaian Kompetensi</th>
            </tr>
          </thead>
          <tbody>
            {data.nilai?.map((n: any, i: number) => (
              <tr key={n.id}>
                <td className="border border-black p-2 text-center">{i + 1}</td>
                <td className="border border-black p-2 font-bold uppercase">{n.mapel_pengampu?.mata_pelajaran?.nama_mapel}</td>
                <td className="border border-black p-2 text-center font-bold">{n.nilai_angka}</td>
                <td className="border border-black p-2  leading-tight text-justify">{n.capaian_kompetensi}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* KOKURIKULER & PROFIL [cite: 5-11] */}
        <div className="mb-6">
          <h3 className="font-bold text-[11px] mb-2">A. KOKURIKULER</h3>
          <p className="text-[10px] text-justify border border-black p-3 leading-relaxed">
            Pada semester ini, ananda menunjukkan capaian yang baik dalam penguatan profil lulusan melalui kegiatan kokurikuler PESANTREN EKOLOGI. 
            Ananda cakap dalam hubungan dengan Tuhan, kewargaan lokal, penyampaian argumentasi, dan hidup bersih serta sehat. [cite: 6, 7, 8, 11]
          </p>
        </div>

        {/* ABSENSI  */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <h3 className="font-bold text-[11px] mb-2 uppercase">Ketidakhadiran</h3>
            <table className="w-full border-collapse border border-black text-[10px]">
              <tbody>
                <tr><td className="border border-black p-2">Sakit</td><td className="border border-black p-2 w-20">{data.absen?.sakit || 0} Hari</td></tr>
                <tr><td className="border border-black p-2">Izin</td><td className="border border-black p-2 w-20">{data.absen?.izin || 0} Hari</td></tr>
                <tr><td className="border border-black p-2">Tanpa Keterangan</td><td className="border border-black p-2 w-20">{data.absen?.alfa || 0} Hari</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-bold text-[11px] mb-2 uppercase">Catatan Wali Kelas</h3>
            <div className="border border-black p-3 h-[85px] text-[10px] ">
              {data.absen?.catatan || "Terus pertahankan semangat belajarmu agar prestasi semakin meningkat."}
            </div>
          </div>
        </div>

        {/* TANDA TANGAN [cite: 20-22] */}
        <div className="grid grid-cols-3 text-center text-[10px] mt-20">
          <div>
            <p>Orang Tua/Wali Murid</p>
            <div className="h-20"></div>
            <p className="font-bold border-b border-black w-40 mx-auto"></p>
          </div>
          <div>
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <div className="h-20"></div>
            <p className="font-bold">Maryono, S.Pd</p>
            <p>NIP. 197208042006041014</p>
          </div>
          <div>
            <p>Samarinda, 25 Maret 2026</p> {/* [cite: 21] */}
            <p>Wali Kelas</p>
            <div className="h-20"></div>
            <p className="font-bold uppercase underline">You Nisa' Khoiriyyah</p>
            <p>NIP. -</p>
          </div>
        </div>

      </div>
    </div>
  )
}