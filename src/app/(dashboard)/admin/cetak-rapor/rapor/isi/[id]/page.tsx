"use client"

import { use, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Printer, ChevronLeft, UserX, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

export default function PrintIsiRaporPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siswaId } = use(params)
  const [data, setData] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // --- 🛡️ LANGKAH 1: AMBIL DATA PROFIL UTAMA ---
        // Kita panggil profil secara mandiri agar tidak terpengaruh Join Table yang kosong
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('id, nama_lengkap, roles, kelas_id')
          .eq('id', siswaId)
          .maybeSingle()

        if (pError) throw pError
        
        if (!profile) {
          setNotFound(true)
          setLoading(false)
          return
        }

        // --- 🚀 LANGKAH 2: AMBIL DATA PENDUKUNG (TERPISAH) ---
        // Menggunakan Promise.all agar tetap ngebut (Paralel)
        const [resBiodata, resKelas, resNilai, resAbsen, resConfig] = await Promise.all([
          // Ambil Biodata (NIS/NISN)
          supabase.from('data_siswa').select('*').eq('id', siswaId).maybeSingle(),
          
          // Ambil Info Kelas & Wali Kelas
          profile.kelas_id 
            ? supabase.from('kelas').select('nama_kelas, profiles:wali_kelas_id(nama_lengkap, nip)').eq('id', profile.kelas_id).maybeSingle() 
            : Promise.resolve({ data: null }),
          
          // Ambil Nilai Akademik
          supabase.from('nilai_akademik').select('*, mapel_pengampu(mata_pelajaran(nama_mapel))').eq('siswa_id', siswaId),
          
          // Ambil Absensi
          supabase.from('absensi_rapor').select('*').eq('siswa_id', siswaId).maybeSingle(),
          
          // Ambil Konfigurasi Sekolah
          supabase.from('konfigurasi_rapor').select('*').maybeSingle()
        ])

        // Satukan data ke dalam state dengan struktur yang sama agar JSX tidak perlu berubah banyak
        setData({ 
          siswa: {
            ...profile,
            data_siswa: resBiodata.data ? [resBiodata.data] : [], // Dibungkus array agar match dengan data.siswa.data_siswa[0]
            kelas: resKelas.data
          }, 
          nilai: resNilai.data || [], 
          absen: resAbsen.data 
        })
        setConfig(resConfig.data)

      } catch (err: any) {
        console.error("Critical Error:", err.message)
        toast.error("Gagal sinkronisasi data master")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [siswaId])

  // --- 1. STATE LOADING ---
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
    </div>
  )

  // --- 2. STATE TIDAK DITEMUKAN / RLS ISSUE ---
  if (notFound) return (
    <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 text-center">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center border border-red-100">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Siswa Tidak Ditemukan</h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed font-medium">
          Data ID <span className="text-primary font-bold">"{siswaId}"</span> ada di DB, tapi aplikasi tidak diizinkan membacanya. <br/>
          <span className="text-red-500 font-bold">SOLUSI:</span> Pastikan RLS di tabel <b>profiles</b> sudah diset ke <b>Enable Select for Authenticated Users</b>.
        </p>
        <div className="flex gap-3 mt-8">
          <Button asChild variant="outline" className="rounded-full font-black uppercase text-[10px]">
            <Link href="/admin/referensi/siswa"><ChevronLeft className="w-4 h-4 mr-2"/> Cek Siswa</Link>
          </Button>
          <Button asChild className="rounded-full font-black uppercase text-[10px] shadow-lg shadow-primary/20">
            <Link href="/admin/cetak-rapor/rapor">Kembali</Link>
          </Button>
        </div>
      </div>
    </div>
  )

  // --- 3. RAPOR VIEW (STRUKTUR ASLI TETAP SAMA) ---
  return (
    <div className="bg-white min-h-screen p-0 italic text-black leading-relaxed">
      <style jsx global>{`
        @media print {
          @page { margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; }
          aside, header, nav, footer, .print\:hidden { display: none !important; }
          .min-h-screen { background: white !important; padding: 0 !important; }
          .paper-container { transform: scale(1.1); transform-origin: top center; width: 100% !important; margin: 0 !important; }
        }
      `}</style>

      {/* TOOLBAR */}
      <div className="fixed top-5 right-5 flex gap-2 print:hidden z-50">
        <Button asChild variant="outline" className="rounded-full bg-white shadow-xl font-bold">
           <Link href="/admin/cetak-rapor/rapor"><ChevronLeft className="w-4 h-4 mr-2"/> KEMBALI</Link>
        </Button>
        <Button onClick={() => window.print()} className="rounded-full shadow-2xl font-black bg-primary text-white px-8">
          <Printer className="mr-2 w-4 h-4" /> CETAK RAPOR (110%)
        </Button>
      </div>

      <div className="paper-container max-w-[21cm] mx-auto bg-white p-[1.5cm] border print:border-none shadow-sm print:shadow-none animate-in fade-in duration-1000">
        
        {/* HEADER IDENTITAS: SINKRON DATA REFERENSI */}
        <div className="grid grid-cols-2 text-[11px] mb-6 uppercase font-bold leading-relaxed">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32">Nama Siswa</span>
              <span className="mr-2">:</span>
              <span className="font-black text-primary">{data?.siswa?.nama_lengkap || "-"}</span>
            </div>
            <div className="flex">
              <span className="w-32">NIS / NISN</span>
              <span className="mr-2">:</span>
              <span>
                {(data?.siswa?.data_siswa && data.siswa.data_siswa[0]?.nis) || "-"} / {(data?.siswa?.data_siswa && data.siswa.data_siswa[0]?.nisn) || "-"}
              </span>
            </div>
            <div className="flex">
              <span className="w-32">Sekolah</span>
              <span className="mr-2">:</span>
              <span>{config?.nama_sekolah || "-"}</span>
            </div>
          </div>
          <div className="space-y-1 ml-auto">
            <div className="flex">
              <span className="w-32 text-right mr-3">Kelas :</span>
              <span className="w-32">{data?.siswa?.kelas?.nama_kelas || "-"}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-right mr-3">Semester :</span>
              <span>{config?.semester || "-"}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-right mr-3">Tahun Ajaran :</span>
              <span className="w-32">{config?.tahun_ajaran || "-"}</span>
            </div>
          </div>
        </div>

        <h2 className="text-center font-black text-sm uppercase mb-6 tracking-widest border-y border-black py-2">
          Laporan Hasil Belajar
        </h2>

        {/* TABEL NILAI */}
        <table className="w-full border-collapse border border-black text-[10px] mb-6">
          <thead>
            <tr className="bg-muted/5 font-black uppercase text-center">
              <th className="border border-black p-2 w-8">No</th>
              <th className="border border-black p-2 text-left">Mata Pelajaran</th>
              <th className="border border-black p-2 w-20">Nilai Akhir</th>
              <th className="border border-black p-2">Capaian Kompetensi</th>
            </tr>
          </thead>
          <tbody>
            {data?.nilai?.length > 0 ? data.nilai.map((n: any, i: number) => (
              <tr key={n.id}>
                <td className="border border-black p-2 text-center">{i + 1}</td>
                <td className="border border-black p-2 font-bold uppercase">{n.mapel_pengampu?.mata_pelajaran?.nama_mapel}</td>
                <td className="border border-black p-2 text-center font-black text-xs">{n.nilai_angka}</td>
                <td className="border border-black p-2 leading-tight text-justify">{n.capaian_competensi || n.capaian_kompetensi}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="border border-black p-4 text-center opacity-30 italic uppercase text-[9px]">Data Nilai Belum Terinput Di Database</td></tr>
            )}
          </tbody>
        </table>

        {/* ABSENSI & CATATAN */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <h3 className="font-bold text-[11px] mb-2 uppercase italic text-[10px]">Ketidakhadiran</h3>
            <table className="w-full border-collapse border border-black text-[10px]">
              <tbody>
                <tr><td className="border border-black p-2 font-bold">Sakit</td><td className="border border-black p-2 w-20 text-center">{data?.absen?.sakit || 0} Hari</td></tr>
                <tr><td className="border border-black p-2 font-bold">Izin</td><td className="border border-black p-2 w-20 text-center">{data?.absen?.izin || 0} Hari</td></tr>
                <tr><td className="border border-black p-2 font-bold">Tanpa Keterangan</td><td className="border border-black p-2 w-20 text-center">{data?.absen?.alfa || 0} Hari</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-bold text-[11px] mb-2 uppercase italic text-[10px]">Catatan Wali Kelas</h3>
            <div className="border border-black p-3 h-[85px] text-[10px] leading-snug">
              {data?.absen?.catatan || "Terus pertahankan prestasi belajar dan tingkatkan kedisiplinan diri."}
            </div>
          </div>
        </div>

        {/* TANDA TANGAN SECTION */}
        <div className="grid grid-cols-3 text-center text-[10px] mt-20 font-bold italic">
          <div>
            <p className="not-italic font-medium">Orang Tua/Wali Murid</p>
            <div className="h-24"></div>
            <p className="border-b border-black w-40 mx-auto uppercase font-black"></p>
          </div>
          <div>
            <p className="not-italic font-medium uppercase">Kepala Sekolah</p>
            <div className="h-24"></div>
            <p className="font-black uppercase underline">{config?.kepala_sekolah || "Nama Kepala Sekolah"}</p>
            <p className="not-italic font-bold">NUPTK. {config?.nip_kepala_sekolah || "-"}</p>
          </div>
          <div>
            <p className="not-italic font-medium">{config?.lokasi || "Lokasi"}, {config?.tanggal_terbit || "..........."}</p>
            <p className="not-italic font-medium uppercase">Wali Kelas</p>
            <div className="h-24"></div>
            <p className="font-black uppercase underline">
              {data?.siswa?.kelas?.profiles?.nama_lengkap || "Nama Wali Kelas"}
            </p>
            <p className="not-italic font-bold">NIP. {data?.siswa?.kelas?.profiles?.nip || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}