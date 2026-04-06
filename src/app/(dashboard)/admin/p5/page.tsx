"use client"

import { Card } from "@/components/ui/card"
import { Construction, Rocket, Target, Star } from "lucide-react"

export default function P5Page() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-700 pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
          <Rocket className="w-8 h-8 text-primary" />
          Projek Penguatan Profil Pelajar Pancasila (P5)
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest">
          Modul Penilaian Karakter & Kokurikuler
        </p>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <Construction className="w-20 h-20 text-primary relative z-10 mb-6" />
        </div>
        
        <h2 className="text-xl md:text-2xl font-black tracking-tight mb-2">
          Modul P5 Sedang Disiapkan
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          Sistem penilaian berbasis dimensi, elemen, dan sub-elemen Profil Pelajar Pancasila akan segera tersedia untuk pengisian nilai akhir projek.
        </p>

        <div className="mt-8 flex gap-6 opacity-30 grayscale">
            <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                    <Target className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">Capaian Kompetensi</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                    <Star className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">Penilaian Karakter</span>
            </div>
        </div>
      </Card>
    </div>
  )
}