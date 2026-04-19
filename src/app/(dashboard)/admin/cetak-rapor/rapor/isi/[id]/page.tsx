"use client"

import { use, useEffect, useState, ChangeEvent } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Printer, ChevronLeft, UserX, ImageIcon, Trash2, MoveHorizontal, Ghost, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // 🚀 Pastikan shadcn input sudah terinstall
import Link from "next/link"
import { Slider } from "@/components/ui/slider"

export default function PrintIsiRaporPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siswaId } = use(params)
  const [data, setData] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [sekolah, setSekolah] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // 🚀 STATE FITUR SPESIAL (BACKGROUND & JUDUL)
  const [bgImage, setBgImage] = useState<string | null>(null)
  const [bgScale, setBgScale] = useState<number>(80) 
  const [bgOpacity, setBgOpacity] = useState<number>(0.1) 
  const [reportTitle, setReportTitle] = useState<string>("LAPORAN HASIL BELAJAR")

  // Fungsi Upload Gambar Lokal
  const handleUploadBg = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBgImage(URL.createObjectURL(file))
    }
  }

  // 🚀 FUNGSI SAKTI: Format Nama + Gelar
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
          's.kom': 'S.Kom.', 'sh': 'S.H.', 'si': 'S.I.', 'h': 'H.', 'hj': 'Hj.'
        };
        let gelarLower = gelar.toLowerCase().replace(/\./g, '');
        return mapping[gelarLower] || gelar; 
      }).join(', ');
      return `${namaUtama}, ${gelarPart}`;
    }
    return namaUtama;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: profile } = await supabase.from('profiles').select('id, nama_lengkap, kelas_id').eq('id', siswaId).maybeSingle()
        if (!profile) { setNotFound(true); setLoading(false); return }

        const [resBiodata, resKelas, resTahun, resNilai, resEkskul, resAbsen, resConfig, resSekolah, resKoku] = await Promise.all([
          supabase.from('data_siswa').select('*').eq('id', siswaId).maybeSingle(),
          profile.kelas_id ? supabase.from('kelas').select('*').eq('id', profile.kelas_id).maybeSingle() : Promise.resolve({ data: null }),
          supabase.from('tahun_ajaran').select('*').limit(1).maybeSingle(),
          supabase.from('nilai_akademik').select('*, mapel_pengampu(mata_pelajaran(nama_mapel))').eq('siswa_id', siswaId),
          supabase.from('nilai_ekskul').select('*, ekskul(nama_ekskul)').eq('siswa_id', siswaId),
          supabase.from('absensi_rapor').select('*').eq('siswa_id', siswaId).maybeSingle(),
          supabase.from('konfigurasi_rapor').select('*').maybeSingle(),
          supabase.from('sekolah').select('*').maybeSingle(),
          supabase.from('kokurikuler').select('deskripsi').eq('siswa_id', siswaId).maybeSingle()
        ])

        let waliName = "-";
        let waliNip = "-";
        const wID = resKelas.data?.wali_id;
        if (wID) {
           const { data: pWali } = await supabase.from('profiles').select('nama_lengkap').eq('id', wID).maybeSingle();
           waliName = pWali?.nama_lengkap || "-";
           let { data: gWali } = await supabase.from('data_guru').select('*').eq('id', wID).maybeSingle();
           if ((!gWali || (!gWali.nuptk && !gWali.nip)) && waliName !== "-") {
              const { data: fallbackGuru } = await supabase.from('data_guru').select('*').ilike('nama_lengkap', `%${waliName.split(',')[0]}%`).maybeSingle();
              if (fallbackGuru) gWali = fallbackGuru;
           }
           if (gWali) waliNip = gWali.nip || gWali.nuptk || "-";
        }

        setData({ 
          siswa: { ...profile, data_siswa: resBiodata.data ? [resBiodata.data] : [], kelas: { ...resKelas.data, wali_kelas_nama: waliName, wali_kelas_nip: waliNip }, tahun_ajaran_data: resTahun.data }, 
          nilai: resNilai.data || [], ekskul: resEkskul.data || [], deskripsiKoku: resKoku.data?.deskripsi || "", absen: resAbsen.data 
        })
        setConfig(resConfig.data); setSekolah(resSekolah.data)
      } catch (err: any) { console.error(err) } finally { setLoading(false) }
    }
    fetchData()
  }, [siswaId])

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
  if (notFound) return <div className="h-screen flex items-center justify-center font-black">SISWA TIDAK DITEMUKAN</div>

  return (
    <div className="bg-white min-h-screen p-0 text-black font-sans leading-relaxed">
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 1.5cm; }
          header, nav, aside, [role="navigation"], footer, .print\:hidden, .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .paper-container { 
            width: 100% !important; margin: 0 !important; border: none !important; 
            box-shadow: none !important; padding: 0 !important; 
            position: relative !important; overflow: hidden !important;
          }
          table td, table th { border: 1px solid black !important; padding: 6px !important; }
          .bg-print-fix { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* 🛠️ TOOLBAR KHUSUS (FITUR SPECIAL) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border shadow-2xl rounded-3xl p-5 flex flex-col gap-4 print:hidden z-50 w-[380px] border-primary/20 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between border-b pb-2">
           <span className="text-[10px] font-black uppercase flex items-center gap-2 text-primary">
             <div className="w-2 h-2 bg-primary rounded-full animate-pulse"/> Panel Kontrol Rapor
           </span>
           {bgImage && (
             <Button variant="ghost" size="icon" onClick={() => setBgImage(null)} className="h-6 w-6 text-red-500 hover:bg-red-50 rounded-full">
               <Trash2 className="w-3 h-3"/>
             </Button>
           )}
        </div>
        
        <div className="space-y-4">
           {/* EDIT JUDUL */}
           <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1">
                <Type className="w-3 h-3"/> Judul Laporan
              </label>
              <Input 
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value.toUpperCase())}
                placeholder="Ganti Judul Di Sini..."
                className="h-8 text-[11px] font-bold uppercase rounded-lg border-gray-200 focus:ring-primary transition-all"
              />
           </div>

           {/* BACKGROUND CONTROLS */}
           {!bgImage ? (
             <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                <ImageIcon className="w-8 h-8 text-gray-300 mb-2"/>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Upload Watermark</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadBg} />
             </label>
           ) : (
             <div className="space-y-4 animate-in zoom-in-95 duration-300">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold uppercase text-gray-500">
                    <span className="flex items-center gap-1"><MoveHorizontal className="w-3 h-3"/> Ukuran Gambar</span>
                    <span>{bgScale}%</span>
                  </div>
                  <Slider value={[bgScale]} max={150} min={10} step={1} onValueChange={(val) => setBgScale(val[0])} />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold uppercase text-gray-500">
                    <span className="flex items-center gap-1"><Ghost className="w-3 h-3"/> Transparansi</span>
                    <span>{Math.round(bgOpacity * 100)}%</span>
                  </div>
                  <Slider value={[bgOpacity * 100]} max={100} min={0} step={1} onValueChange={(val) => setBgOpacity(val[0] / 100)} />
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Toolbar Utama */}
      <div className="fixed top-5 right-5 flex gap-2 print:hidden z-50">
        <Button asChild variant="outline" className="rounded-full bg-white shadow-xl font-bold uppercase text-[10px]">
           <Link href="/admin/cetak-rapor/rapor"><ChevronLeft className="w-4 h-4 mr-2"/> KEMBALI</Link>
        </Button>
        <Button onClick={() => window.print()} className="rounded-full shadow-2xl font-black bg-primary text-white px-8 uppercase text-[10px] hover:scale-105 transition-transform">
          <Printer className="mr-2 w-4 h-4" /> CETAK RAPOR
        </Button>
      </div>

      <div className="paper-container max-w-[21cm] mx-auto bg-white p-[1.2cm] border relative">
        
        {/* 🚀 BACKGROUND IMAGE */}
        {bgImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-print-fix" style={{ zIndex: 0 }}>
            <img src={bgImage} alt="rapor-bg" style={{ width: `${bgScale}%`, opacity: bgOpacity }} className="object-contain" />
          </div>
        )}

        {/* Konten Rapor */}
        <div className="relative" style={{ zIndex: 1 }}>
          {/* HEADER IDENTITAS */}
          <div className="grid grid-cols-2 text-[11px] mb-8 font-bold leading-relaxed">
            <div className="space-y-1">
              <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">NAMA SISWA</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{data?.siswa?.nama_lengkap || "-"}</span></div>
              <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">NIS / NISN</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{data?.siswa?.data_siswa?.[0]?.nis || "-"} / {data?.siswa?.data_siswa?.[0]?.nisn || "-"}</span></div>
              <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">SEKOLAH</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{sekolah?.nama_sekolah || config?.nama_sekolah || "-"}</span></div>
            </div>
            <div className="space-y-1 flex flex-col items-end">
              <div className="w-full max-w-[280px]">
                <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">KELAS</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{data?.siswa?.kelas?.nama_kelas || "-"}</span></div>
                <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">SEMESTER</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{config?.semester || "-"}</span></div>
                <div className="flex items-start"><span className="w-28 uppercase flex-shrink-0">TAHUN AJARAN</span><span className="mr-2 flex-shrink-0">:</span><span className="flex-1 uppercase">{data?.siswa?.tahun_ajaran_data?.tahun_ajaran || "-"}</span></div>
              </div>
            </div>
          </div>

          {/* 🎯 JUDUL DINAMIS */}
          <h2 className="text-center font-black text-sm uppercase mb-4 tracking-widest">
            {reportTitle || "LAPORAN HASIL BELAJAR"}
          </h2>

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
              {data?.nilai?.map((n: any, i: number) => (
                <tr key={n.id}>
                  <td className="text-center">{i + 1}</td>
                  <td className="uppercase font-bold">{n.mapel_pengampu?.mata_pelajaran?.nama_mapel}</td>
                  <td className="text-center font-bold">{n.nilai_angka}</td>
                  <td className="leading-normal text-justify">{n.capaian_kompetensi}</td>
                </tr>
              ))}
              <tr className="font-bold text-center bg-gray-50/30 uppercase tracking-widest text-[10px]"><td colSpan={4} className="p-2 border-t-2">Kokurikuler (P5)</td></tr>
              <tr><td colSpan={4} className="p-4 min-h-[80px] leading-relaxed text-justify ">{data?.deskripsiKoku || "Narasi belum dihasilkan."}</td></tr>
            </tbody>
          </table>

          <table className="w-full border-collapse text-[11px] -mt-[1px] mb-6">
            <thead>
              <tr className="text-center font-bold uppercase bg-gray-50/30 text-[10px]">
                <th className="w-10">No</th>
                <th className="text-left w-1/3">Ekstrakurikuler</th>
                <th className="text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {data?.ekskul?.length > 0 ? data.ekskul.map((e: any, i: number) => (
                <tr key={e.id}>
                  <td className="text-center">{i + 1}</td>
                  <td className="uppercase font-bold">{e.ekskul?.nama_ekskul || "-"}</td>
                  <td className="leading-normal text-justify">
                    {e.nilai || e.predikat ? <span className="font-bold">Predikat {e.nilai || e.predikat}. </span> : ""}
                    {e.keterangan || "-"}
                  </td>
                </tr>
              )) : (
                <tr><td className="text-center">1</td><td className=" text-center opacity-40" colSpan={2}>Tidak ada data</td></tr>
              )}
            </tbody>
          </table>

          {/* ABSENSI & CATATAN */}
          <div className="grid grid-cols-[1.5fr_2.5fr] gap-6 mb-4">
            <div className="space-y-2">
              <h3 className="font-bold text-[11px] text-center uppercase border border-black p-1 bg-gray-50/30">Ketidakhadiran</h3>
              <table className="w-full border-collapse text-[11px]">
                <tbody>
                  <tr><td className="p-1 font-bold uppercase w-28 text-[10px]">Sakit</td><td>: {data?.absen?.sakit || 0} hari</td></tr>
                  <tr><td className="p-1 font-bold uppercase w-28 text-[10px]">Izin</td><td>: {data?.absen?.izin || 0} hari</td></tr>
                  <tr><td className="p-1 font-bold uppercase w-28 text-[10px]">Tanpa Ket.</td><td>: {data?.absen?.alfa || 0} hari</td></tr>
                </tbody>
              </table>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-[11px] text-center uppercase border border-black p-1 bg-gray-50/30">Catatan Wali Kelas</h3>
              <div className="border border-black p-4 h-[105px] text-[11px] leading-relaxed text-justify ">
                {data?.absen?.catatan || "Terus tingkatkan prestasi belajar."}
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
                <p className="underline leading-tight">{formatNamaGelar(data?.siswa?.kelas?.wali_kelas_nama)}</p>
                <p className="font-medium text-[9px]">NUPTK. {data?.siswa?.kelas?.wali_kelas_nip || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}