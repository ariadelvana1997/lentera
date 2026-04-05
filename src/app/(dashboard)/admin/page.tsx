import { Users, GraduationCap, BookOpen, Activity, Zap, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminPage() {
  const stats = [
    { title: "Total Siswa", val: "1.240", icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
    { title: "Total Guru", val: "84", icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-500/10" },
    { title: "Mata Pelajaran", val: "24", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { title: "Log Sistem", val: "Active", icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-500/10" },
  ]

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header Halaman - Responsive sizing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight truncate">
            Ringkasan Data
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1 truncate">
            Selamat datang kembali di panel kendali LENTERA.
          </p>
        </div>
        <div className="flex shrink-0">
           <div className="bg-primary/10 text-primary px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold flex items-center gap-2 border border-primary/20">
              <Zap className="w-3 h-3 fill-primary shrink-0" />
              <span className="uppercase tracking-wider">Sistem Normal</span>
           </div>
        </div>
      </div>

      {/* Grid Widget Statistik - Fixed Gap & Fit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s) => (
          <Card key={s.title} className="border-none shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-1 active:scale-[0.98]">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                    {s.title}
                  </p>
                  <h3 className="text-2xl md:text-3xl font-black mt-1 tracking-tighter text-foreground truncate">
                    {s.val}
                  </h3>
                </div>
                <div className={`${s.bg} p-2.5 md:p-3 rounded-2xl transition-transform group-hover:rotate-12 shrink-0`}>
                  <s.icon className={`w-5 h-5 md:w-6 md:h-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Area Konten Utama - Optimized for Mobile height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-card/40 border rounded-3xl p-6 md:p-8 min-h-[280px] md:min-h-[350px] flex flex-col items-center justify-center border-dashed relative overflow-hidden">
            {/* Dekorasi halus */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <Activity className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/30 mb-4" />
            <h4 className="font-bold text-base md:text-lg text-foreground text-center">Visualisasi Data Belum Tersedia</h4>
            <p className="text-xs md:text-sm text-muted-foreground max-w-[280px] md:max-w-sm mx-auto mt-2 text-center leading-relaxed">
              Grafik perkembangan nilai dan statistik kelulusan akan muncul di sini setelah sinkronisasi data rapor dilakukan oleh Wali Kelas.
            </p>
         </div>

         {/* Info Terkini Widget */}
         <div className="bg-card/40 border rounded-3xl p-5 md:p-6">
            <h4 className="font-bold text-sm md:text-base mb-4 flex items-center gap-2">
               <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shrink-0"></span>
               Info Terkini
            </h4>
            <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                     <p className="text-[10px] font-bold text-primary mb-1 tracking-wider">PENGUMUMAN</p>
                     <p className="text-xs md:text-sm font-medium leading-relaxed text-foreground/90">
                        Persiapan input nilai akhir semester genap tahun ajaran 2025/2026.
                     </p>
                     <p className="text-[9px] md:text-[10px] text-muted-foreground mt-2 uppercase font-semibold">2 Jam yang lalu</p>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Footer Signature DELVANA */}
      <div className="text-center pt-4 md:pt-8">
        <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-40">
          LENTERA Integrated Admin Dashboard • Created by DELVANA
        </p>
      </div>
    </div>
  )
}