"use client"

import { use, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Printer, ChevronLeft, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

export default function PrintIsiRaporPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siswaId } = use(params)
  const [data, setData] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [sekolah, setSekolah] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 1. Ambil Profil Siswa
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, nama_lengkap, kelas_id')
          .eq('id', siswaId)
          .maybeSingle()

        if (!profile) { setNotFound(true); setLoading(false); return }

        // 2. Tarik Data Utama (🎯 UPDATE: Menembak tabel kokurikuler hasil tutorial)
        const [resBiodata, resKelas, resTahun, resNilai, resEkskul, resAbsen, resConfig, resSekolah, resKoku] = await Promise.all([
          supabase.from('data_siswa').select('*').eq('id', siswaId).maybeSingle(),
          profile.kelas_id ? supabase.from('kelas').select('*').eq('id', profile.kelas_id).maybeSingle() : Promise.resolve({ data: null }),
          supabase.from('tahun_ajaran').select('*').limit(1).maybeSingle(),
          supabase.from('nilai_akademik').select('*, mapel_pengampu(mata_pelajaran(nama_mapel))').eq('siswa_id', siswaId),
          supabase.from('ekstrakurikuler').select('*').eq('siswa_id', siswaId),
          supabase.from('absensi_rapor').select('*').eq('siswa_id', siswaId).maybeSingle(),
          supabase.from('konfigurasi_rapor').select('*').maybeSingle(),
          supabase.from('sekolah').select('*').maybeSingle(),
          
          // 🚀 JALUR FINAL: Mengambil deskripsi narasi dari tabel kokurikuler
          supabase
            .from('kokurikuler')
            .select('deskripsi')
            .eq('siswa_id', siswaId)
            .maybeSingle()
        ])

        // Debug Log buat mastiin datanya nongol di Console
        console.log("DATA KOKU DITERIMA:", resKoku.data);

        let waliKelasName = "-";
        let waliKelasNip = "-";
        if (resKelas.data?.wali_kelas_id) {
           const { data: wk } = await supabase.from('profiles').select('nama_lengkap, nip').eq('id', resKelas.data.wali_kelas_id).maybeSingle();
           waliKelasName = wk?.nama_lengkap || "-";
           waliKelasNip = wk?.nip || "-";
        }

        setData({ 
          siswa: {
            ...profile,
            data_siswa: resBiodata.data ? [resBiodata.data] : [],
            kelas: { ...resKelas.data, wali_kelas_nama: waliKelasName, wali_kelas_nip: waliKelasNip },
            tahun_ajaran_data: resTahun.data
          }, 
          nilai: resNilai.data || [], 
          ekskul: resEkskul.data || [],
          // 🚀 MAPPING: Mengambil kolom 'deskripsi'
          deskripsiKoku: resKoku.data?.deskripsi || "",
          absen: resAbsen.data 
        })
        
        setConfig(resConfig.data)
        setSekolah(resSekolah.data)

      } catch (err: any) {
        console.error("Fetch Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [siswaId])

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>

  if (notFound) return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-10">
       <UserX className="w-16 h-16 text-red-500 mb-2" />
       <h1 className="font-black uppercase text-sm">Siswa Tidak Ditemukan</h1>
       <Button asChild className="mt-4 rounded-full font-black text-[10px] uppercase"><Link href="/admin/cetak-rapor/rapor">Kembali</Link></Button>
    </div>
  )

  return (
    <div className="bg-white min-h-screen p-0 text-black font-sans leading-relaxed">
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 1.2cm; }
          body { -webkit-print-color-adjust: exact; }
          .print\:hidden { display: none !important; }
          .paper-container { width: 100% !important; margin: 0 !important; border: none !important; padding: 0 !important; box-shadow: none !important; }
        }
        table td, table th { border: 1px solid black !important; padding: 6px !important; }
      `}</style>

      {/* Toolbar */}
      <div className="fixed top-5 right-5 flex gap-2 print:hidden z-50">
        <Button asChild variant="outline" className="rounded-full bg-white shadow-xl font-bold uppercase text-[10px]">
           <Link href="/admin/cetak-rapor/rapor"><ChevronLeft className="w-4 h-4 mr-2"/> KEMBALI</Link>
        </Button>
        <Button onClick={() => window.print()} className="rounded-full shadow-2xl font-black bg-primary text-white px-8 uppercase text-[10px]">
          <Printer className="mr-2 w-4 h-4" /> CETAK RAPOR
        </Button>
      </div>

      <div className="paper-container max-w-[21cm] mx-auto bg-white p-[1.2cm] border">
        
        {/* HEADER IDENTITAS: FIXED BALANCE & NIS/NISN */}
        <div className="grid grid-cols-2 text-[11px] mb-8 font-bold">
          <div className="space-y-1">
            <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">NAMA SISWA</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{data?.siswa?.nama_lengkap || "-"}</span></div>
            <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">NIS / NISN</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{data?.siswa?.data_siswa?.[0]?.nis || "-"} / {data?.siswa?.data_siswa?.[0]?.nisn || "-"}</span></div>
            <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">SEKOLAH</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{sekolah?.nama_sekolah || config?.nama_sekolah || "LENTERA ACADEMY"}</span></div>
          </div>
          <div className="space-y-1 flex flex-col items-end">
            <div className="w-full max-w-[280px]">
              <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">KELAS</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{data?.siswa?.kelas?.nama_kelas || "-"}</span></div>
              <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">SEMESTER</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{config?.semester || "-"}</span></div>
              <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">TAHUN AJARAN</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{data?.siswa?.tahun_ajaran_data?.tahun_ajaran || "-"}</span></div>
            </div>
          </div>
        </div>

        <h2 className="text-center font-black text-sm uppercase mb-4 tracking-widest">LAPORAN HASIL BELAJAR</h2>

        {/* TABEL UTAMA: NILAI + NARASI KOKURIKULER OTOMATIS */}
        <table className="w-full border-collapse text-[11px] mb-0">
          <thead>
            <tr className="text-center font-bold uppercase bg-gray-50">
              <th className="w-10">No</th>
              <th className="text-left">Mata Pelajaran</th>
              <th className="w-24">Nilai Akhir</th>
              <th>Capaian Kompetensi</th>
            </tr>
          </thead>
          <tbody>
            {data?.nilai?.map((n: any, i: number) => (
              <tr key={n.id}>
                <td className="text-center">{i + 1}</td>
                <td className="uppercase font-bold">{n.mapel_pengampu?.mata_pelajaran?.nama_mapel}</td>
                <td className="text-center font-bold">{n.nilai_angka}</td>
                <td className="leading-normal text-justify">{n.capaian_kompetensi}</td>
              </tr>
            ))}
            <tr className="font-bold text-center bg-gray-50 uppercase">
              <td colSpan={4} className="p-2 tracking-widest border-t-2">Kokurikuler</td>
            </tr>
            <tr>
              <td colSpan={4} className="p-4 min-h-[80px] leading-relaxed text-justify ">
                {/* 🚀 NARASI OTOMATIS DIAMBIL DARI TABEL KOKURIKULER */}
                {data?.deskripsiKoku || "Narasi kokurikuler otomatis belum dihasilkan oleh Wali Kelas."}
              </td>
            </tr>
          </tbody>
        </table>

        {/* TABEL EKSTRAKURIKULER */}
        <table className="w-full border-collapse text-[11px] -mt-[1px] mb-6">
          <thead>
            <tr className="text-center font-bold uppercase bg-gray-50 text-[10px]">
              <th className="w-10">No</th>
              <th className="text-left w-1/3">Ekstrakurikuler</th>
              <th className="text-left">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {data?.ekskul?.length > 0 ? data.ekskul.map((e: any, i: number) => (
              <tr key={e.id}>
                <td className="text-center">{i + 1}</td>
                <td className="uppercase font-bold">{e.nama_ekskul || e.kegiatan || "-"}</td>
                <td className="leading-normal">Lulus dengan predikat {e.predikat || e.nilai || "-"} - {e.keterangan || ""}</td>
              </tr>
            )) : (
              <tr><td className="text-center">1</td><td className=" text-center opacity-40" colSpan={2}>Tidak ada data ekstrakurikuler</td></tr>
            )}
          </tbody>
        </table>

        {/* BAGIAN BAWAH: ABSENSI, CATATAN, TANDA TANGAN */}
        <div className="grid grid-cols-[1.5fr_2.5fr] gap-6 mb-4">
          <div className="space-y-2">
            <h3 className="font-bold text-[11px] text-center uppercase border border-black p-1 bg-gray-50">Ketidakhadiran</h3>
            <table className="w-full border-collapse text-[11px]">
              <tbody>
                <tr><td className="p-1 font-bold uppercase w-28 text-[10px]">Sakit</td><td>: {data?.absen?.sakit || 0} hari</td></tr>
                <tr><td className="p-2 font-bold uppercase w-28 text-[10px]">Izin</td><td>: {data?.absen?.izin || 0} hari</td></tr>
                <tr><td className="p-2 font-bold uppercase w-28 text-[10px]">Tanpa Ket.</td><td>: {data?.absen?.alfa || 0} hari</td></tr>
              </tbody>
            </table>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-[11px] text-center uppercase border border-black p-1 bg-gray-50">Catatan Wali Kelas</h3>
            <div className="border border-black p-4 h-[105px] text-[11px] leading-relaxed  text-justify">
              {data?.absen?.catatan || "Terus tingkatkan prestasi belajar dan kedisiplinan diri."}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-10">
          <h3 className="font-bold text-[11px] text-center uppercase border border-black p-1 bg-gray-50">Tanggapan Orang Tua/Wali Murid</h3>
          <div className="border border-black h-[80px]"></div>
        </div>

        <div className="grid grid-cols-3 text-center text-[10px] font-bold">
          <div className="flex flex-col justify-between h-32">
            <p className="uppercase">Orang Tua/Wali Murid</p>
            <p className="border-b border-black w-32 mx-auto"></p>
          </div>
          <div className="flex flex-col justify-between h-32">
            <p className="uppercase">Kepala Sekolah</p>
            <div>
              <p className="underline uppercase">{config?.kepala_sekolah || "-"}</p>
              <p className="font-medium text-[9px] mt-1">NUPTK. {config?.nip_kepala_sekolah || "-"}</p>
            </div>
          </div>
          <div className="flex flex-col justify-between h-32">
            <div>
              <p className="font-medium">{config?.lokasi || "Lokasi"}, {config?.tanggal_terbit || "..........."}</p>
              <p className="uppercase">Wali Kelas</p>
            </div>
            <div>
              <p className="underline uppercase">{data?.siswa?.kelas?.wali_kelas_nama || "-"}</p>
              <p className="font-medium text-[9px] mt-1">NIP. {data?.siswa?.kelas?.wali_kelas_nip || "-"}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}