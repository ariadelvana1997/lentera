"use client"

import { Card } from "@/components/ui/card"
import { Construction, Camera, User, Image as ImageIcon } from "lucide-react"

export default function FotoSiswaPage() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-700 pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
          <Camera className="w-8 h-8 text-primary" />
          Pas Foto Siswa
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">
          Manajemen Foto Identitas Peserta Didik
        </p>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <Construction className="w-20 h-20 text-primary relative z-10 mb-6" />
        </div>
        
        <h2 className="text-xl md:text-2xl font-black tracking-tight mb-2">
          Dalam Tahap Pengembangan Lebih Lanjut
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          Fitur unggah foto siswa secara massal, integrasi kamera langsung, dan sinkronisasi pas foto untuk cetak rapor digital sedang kami siapkan.
        </p>

        <div className="mt-8 flex gap-6 opacity-30 grayscale">
            <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                    <User className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">Upload Pas Foto</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                    <ImageIcon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">Gallery View</span>
            </div>
        </div>
      </Card>
    </div>
  )
}