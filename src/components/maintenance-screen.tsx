"use client"

import Image from "next/image"
import { Coffee } from "lucide-react"

export default function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 text-center">
      {/* Visual Kucing Molor */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 animate-bounce duration-[3000ms]">
        <Image 
          src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500&auto=format&fit=crop" 
          alt="Kucing Molor"
          fill
          className="object-cover rounded-[3rem] shadow-2xl border-4 border-primary/20"
        />
      </div>
      
      <div className="space-y-4 max-w-md">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest  animate-pulse">
          <Coffee className="w-3 h-3" /> System Maintenance
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter ">
          MODE <span className="text-primary">MAINTENANCE</span>
        </h1>
        
        <p className="text-muted-foreground font-bold text-sm  leading-relaxed">
          Sstt... Server LENTERA lagi istirahat sebentar kayak kucing di atas. 
          Guru-guru harap bersabar ya, admin lagi beresin dapur biar makin gacor!
        </p>
      </div>

      <div className="absolute bottom-10 opacity-20 font-black text-[10px] uppercase tracking-[0.5em] ">
        LENTERA ENGINE v1.0
      </div>
    </div>
  )
}