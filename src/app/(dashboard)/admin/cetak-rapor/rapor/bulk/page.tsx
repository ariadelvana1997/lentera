"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

function BulkPrintContent() {
  const searchParams = useSearchParams()
  const ids = searchParams.get("ids")?.split(",") || []
  const title = searchParams.get("title") || "LAPORAN HASIL BELAJAR"
  const scale = searchParams.get("scale") || "80"
  const opacity = searchParams.get("opacity") || "0.1"
  const bulkBg = searchParams.get("bg")

  const [allData, setAllData] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)
  const [sekolah, setSekolah] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const formatNamaGelar = (str: string) => {
    if (!str || str === "-") return "-";
    const parts = str.split(',');
    const namaUtama = parts[0].toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (parts.length > 1) {
      const gelarPart = parts.slice(1).map(g => {
        let gelar = g.trim();
        const mapping: { [key: string]: string } = {
          'spd': 'S.Pd.', 's.pd': 'S.Pd.', 'mpd': 'M.Pd.', 'm.pd': 'M.Pd.',
          'gr': 'Gr.', 'st': 'S.T.', 's.t': 'S.T.', 'skom': 'S.Kom.',
          's.kom': 'S.Kom.', 'sh': 'S.H.', 'h': 'H.', 'hj': 'Hj.'
        };
        let gelarLower = gelar.toLowerCase().replace(/\./g, '');
        return mapping[gelarLower] || gelar; 
      }).join(', ');
      return `${namaUtama}, ${gelarPart}`;
    }
    return namaUtama;
  };

  // 🚀 Tambahkan ids.length ke dependency agar re-fetch kalau ID berubah
  useEffect(() => {
    if (ids.length > 0) fetchData()
  }, [ids.length])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resConfig, resSekolah] = await Promise.all([
        supabase.from('konfigurasi_rapor').select('*').maybeSingle(),
        supabase.from('sekolah').select('*').maybeSingle()
      ])
      setConfig(resConfig.data); setSekolah(resSekolah.data)

      const fetchPromises = ids.map(async (id) => {
        const { data: profile } = await supabase.from('profiles').select('id, nama_lengkap, kelas_id').eq('id', id).maybeSingle()
        if (!profile) return null

        const [resBio, resKelas, resTahun, resNilai, resEkskul, resAbsen, resKoku] = await Promise.all([
          supabase.from('data_siswa').select('*').eq('id', id).maybeSingle(),
          profile.kelas_id ? supabase.from('kelas').select('*').eq('id', profile.kelas_id).maybeSingle() : Promise.resolve({ data: null }),
          supabase.from('tahun_ajaran').select('*').limit(1).maybeSingle(),
          supabase.from('nilai_akademik').select('*, mapel_pengampu(mata_pelajaran(nama_mapel))').eq('siswa_id', id),
          supabase.from('nilai_ekskul').select('*, ekskul(nama_ekskul)').eq('siswa_id', id),
          supabase.from('absensi_rapor').select('*').eq('siswa_id', id).maybeSingle(),
          supabase.from('kokurikuler').select('deskripsi').eq('siswa_id', id).maybeSingle()
        ])

        let waliName = "-"; let waliNip = "-";
        const wID = resKelas.data?.wali_id;
        if (wID) {
           const { data: pWali } = await supabase.from('profiles').select('nama_lengkap').eq('id', wID).maybeSingle();
           waliName = pWali?.nama_lengkap || "-";
           let { data: gWali } = await supabase.from('data_guru').select('*').eq('id', wID).maybeSingle();
           if ((!gWali || (!gWali.nuptk && !gWali.nip)) && waliName !== "-") {
              const { data: fGuru } = await supabase.from('data_guru').select('*').ilike('nama_lengkap', `%${waliName.split(',')[0]}%`).maybeSingle();
              if (fGuru) gWali = fGuru;
           }
           if (gWali) waliNip = gWali.nip || gWali.nuptk || "-";
        }

        return {
          siswa: { ...profile, data_siswa: resBio.data ? [resBio.data] : [], kelas: { ...resKelas.data, wali_kelas_nama: waliName, wali_kelas_nip: waliNip }, tahun_ajaran_data: resTahun.data },
          nilai: resNilai.data || [], ekskul: resEkskul.data || [], koku: resKoku.data?.deskripsi || "", absen: resAbsen.data
        }
      })

      const results = await Promise.all(fetchPromises)
      setAllData(results.filter(r => r !== null))
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-primary w-12 h-12" />
      <p className="font-black uppercase text-[10px] tracking-widest animate-pulse">Menyiapkan {ids.length} Rapor Siswa...</p>
    </div>
  )

  return (
    <div className="bg-gray-200 min-h-screen p-0 md:p-10 text-black font-sans leading-relaxed">
      {/* 🚀 CSS GLOBAL PRINT: FIX HANYA MUNCUL 1 HALAMAN */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0; }
          
          html, body {
            height: auto !important; /* 🎯 Biar bisa memanjang ke bawah */
            overflow: visible !important; /* 🎯 WAJIB visible agar printer lihat lembar berikutnya */
            margin: 0 !important;
            padding: 0 !important;
          }

          header, nav, aside, footer, [role="navigation"], .print\:hidden, .no-print { display: none !important; }

          /* Sembunyikan scrollbar tapi konten tetap ada */
          ::-webkit-scrollbar { display: none !important; }
          * { scrollbar-width: none !important; -ms-overflow-style: none !important; }

          .paper-container { 
            width: 210mm !important; 
            min-height: 297mm !important; 
            margin: 0 !important; 
            border: none !important; 
            box-shadow: none !important; 
            padding: 1.2cm !important; 
            position: relative !important; 
            page-break-after: always !important; /* 🎯 Pindah kertas otomatis */
          }
          .bg-print-fix { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          table td, table th { border: 1px solid black !important; padding: 6px !important; }
        }

        .paper-container { background: white; margin: 0 auto 2rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 21cm; }
        table td, table th { border: 1px solid black !important; padding: 6px !important; }
      `}</style>

      {/* Toolbar */}
      <div className="fixed top-5 right-5 flex gap-2 print:hidden z-50">
        <Button onClick={() => window.print()} className="rounded-full shadow-2xl font-black bg-primary text-white px-10 uppercase text-[10px] h-12">
          <Printer className="mr-2 w-4 h-4" /> CETAK SEMUA ({allData.length})
        </Button>
      </div>

      {allData.map((d, index) => (
        <div key={index} className="paper-container relative overflow-hidden">
          
          {/* BACKGROUND WATERMARK */}
          {bulkBg && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-print-fix" style={{ zIndex: 0 }}>
              <img src={bulkBg} alt="bg" style={{ width: `${scale}%`, opacity: opacity }} className="object-contain" />
            </div>
          )}

          <div className="relative" style={{ zIndex: 1 }}>
            {/* HEADER IDENTITAS */}
            <div className="grid grid-cols-2 text-[11px] mb-8 font-bold leading-relaxed">
              <div className="space-y-1">
                <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0 text-left">NAMA SISWA</span><span className="mr-2">:</span><span className="flex-1 uppercase text-left">{d.siswa.nama_lengkap}</span></div>
                <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0 text-left">NIS / NISN</span><span className="mr-2">:</span><span className="flex-1 uppercase text-left">{d.siswa.data_siswa?.[0]?.nis || "-"} / {d.siswa.data_siswa?.[0]?.nisn || "-"}</span></div>
                <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0 text-left">SEKOLAH</span><span className="mr-2">:</span><span className="flex-1 uppercase text-left">{sekolah?.nama_sekolah || config?.nama_sekolah || "-"}</span></div>
              </div>
              <div className="space-y-1 flex flex-col items-end">
                <div className="w-full max-w-[280px]">
                  <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0 text-left">KELAS</span><span className="mr-2">:</span><span className="flex-1 uppercase text-left">{d.siswa.kelas?.nama_kelas || "-"}</span></div>
                  <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0 text-left">SEMESTER</span><span className="mr-2">:</span><span className="flex-1 uppercase text-left">{config?.semester || "-"}</span></div>
                  <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0 text-left">TAHUN AJARAN</span><span className="mr-2">:</span><span className="flex-1 uppercase text-left">{d.siswa.tahun_ajaran_data?.tahun_ajaran || "-"}</span></div>
                </div>
              </div>
            </div>

            <h2 className="text-center font-black text-sm uppercase mb-4 tracking-widest">{title}</h2>

            {/* TABEL NILAI + P5 */}
            <table className="w-full border-collapse text-[11px] mb-0 bg-transparent">
              <thead>
                <tr className="text-center font-bold bg-gray-50/30 uppercase">
                  <th className="w-10">No</th>
                  <th className="text-left">Mata Pelajaran</th>
                  <th className="w-24">Nilai Akhir</th>
                  <th>Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody>
                {d.nilai.map((n: any, i: number) => (
                  <tr key={i}>
                    <td className="text-center">{i + 1}</td>
                    <td className="uppercase font-bold">{n.mapel_pengampu?.mata_pelajaran?.nama_mapel}</td>
                    <td className="text-center font-bold">{n.nilai_angka}</td>
                    <td className="leading-normal text-justify">{n.capaian_kompetensi}</td>
                  </tr>
                ))}
                <tr className="font-bold text-center bg-gray-50/30 uppercase tracking-widest text-[10px]"><td colSpan={4} className="p-2 border-t-2">Kokurikuler (P5)</td></tr>
                <tr><td colSpan={4} className="p-4 min-h-[80px] leading-relaxed text-justify italic">{d.koku || "Narasi belum dihasilkan."}</td></tr>
              </tbody>
            </table>

            {/* TABEL EKSTRAKURIKULER */}
            <table className="w-full border-collapse text-[11px] -mt-[1px] mb-6">
              <thead>
                <tr className="text-center font-bold uppercase bg-gray-50/30 text-[10px]">
                  <th className="w-10">No</th>
                  <th className="text-left w-1/3">Ekstrakurikuler</th>
                  <th className="text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {d.ekskul.length > 0 ? d.ekskul.map((e: any, i: number) => (
                  <tr key={i}>
                    <td className="text-center">{i + 1}</td>
                    <td className="uppercase font-bold">{e.ekskul?.nama_ekskul || "-"}</td>
                    <td className="leading-normal text-justify">
                      {e.nilai || e.predikat ? <span className="font-bold">Predikat {e.nilai || e.predikat}. </span> : ""}
                      {e.keterangan || "-"}
                    </td>
                  </tr>
                )) : (
                  <tr><td className="text-center">1</td><td className=" text-center opacity-40" colSpan={2}>Tidak ada data ekstrakurikuler</td></tr>
                )}
              </tbody>
            </table>

            {/* ABSENSI & CATATAN */}
            <div className="grid grid-cols-[1.5fr_2.5fr] gap-6 mb-4">
              <div className="space-y-2">
                <h3 className="font-bold text-[11px] text-center uppercase border border-black p-1 bg-gray-50/30">Ketidakhadiran</h3>
                <table className="w-full border-collapse text-[11px]">
                  <tbody>
                    <tr><td className="p-1 font-bold uppercase w-28 text-[10px]">Sakit</td><td>: {d.absen?.sakit || 0} hari</td></tr>
                    <tr><td className="p-1 font-bold uppercase w-28 text-[10px]">Izin</td><td>: {d.absen?.izin || 0} hari</td></tr>
                    <tr><td className="p-1 font-bold uppercase w-28 text-[10px]">Tanpa Ket.</td><td>: {d.absen?.alfa || 0} hari</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-[11px] text-center uppercase border border-black p-1 bg-gray-50/30">Catatan Wali Kelas</h3>
                <div className="border border-black p-4 h-[105px] text-[11px] leading-relaxed text-justify italic">
                  {d.absen?.catatan || "Terus tingkatkan prestasi belajar dan kedisplinan diri."}
                </div>
              </div>
            </div>

            {/* SIGNATURE SECTION */}
            <div className="grid grid-cols-3 text-center text-[10px] font-bold mt-10">
              <div className="flex flex-col justify-between h-32">
                <p className="uppercase">Orang Tua/Wali Murid</p>
                <p className="border-b border-black w-32 mx-auto uppercase pt-20"></p>
              </div>
              <div className="flex flex-col justify-between h-32">
                <p className="uppercase">Kepala Sekolah</p>
                <div>
                  <p className="underline leading-tight">{formatNamaGelar(sekolah?.kepala_sekolah)}</p>
                  <p className="font-medium text-[9px]">NUPTK. {sekolah?.nip_kepala_sekolah || sekolah?.nip || "-"}</p>
                </div>
              </div>
              <div className="flex flex-col justify-between h-32">
                <div>
                  <p className="font-medium uppercase">{config?.lokasi || "Lokasi"}, {config?.tanggal_terbit || "..........."}</p>
                  <p className="uppercase">Wali Kelas</p>
                </div>
                <div>
                  <p className="underline leading-tight">{formatNamaGelar(d.siswa.kelas.wali_kelas_nama)}</p>
                  <p className="font-medium text-[9px]">NUPTK. {d.siswa.kelas.wali_kelas_nip || "-"}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  )
}

export default function BulkPrintPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}>
      <BulkPrintContent />
    </Suspense>
  )
}