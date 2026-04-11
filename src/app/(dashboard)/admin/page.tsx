"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useTranslation } from "@/context/language-context"
import { 
  Users, GraduationCap, BookOpen, Activity, Zap, ShieldCheck, Loader2,
  CloudSun, Sun, Moon, Thermometer, Wind, Clock, CloudRain, CloudLightning, Cloud
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminPage() {
  const { t } = useTranslation()
  
  // --- 1. STATE UNTUK FIX HYDRATION ---
  const [mounted, setMounted] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())
  
  // State Cuaca Open-Meteo - Lokasi: Cicalengka
  const [weather, setWeather] = useState({
    temp: 0,
    wind: 0,
    weatherCode: 0,
    city: "Cicalengka",
    loading: true
  })

  const [dataStats, setDataStats] = useState({ siswa: 0, guru: 0, mapel: 0 })

  useEffect(() => {
    // Set mounted true agar Client tahu dia sudah aman untuk merender data dinamis
    setMounted(true)
    
    const timer = setInterval(() => setTime(new Date()), 1000)
    fetchStats()
    fetchWeather() 
    return () => clearInterval(timer)
  }, [])

  // --- FUNGSI AMBIL DATA CUACA (OPEN-METEO) ---
  const fetchWeather = async () => {
    const LAT = "-6.9944"
    const LON = "107.8344"
    
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`
      );
      const data = await res.json();
      
      if (data.current) {
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          wind: Math.round(data.current.wind_speed_10m),
          weatherCode: data.current.weather_code,
          city: "Cicalengka",
          loading: false
        });
      }
    } catch (error) {
      console.error("Gagal ambil cuaca Open-Meteo:", error);
      setWeather(prev => ({ ...prev, loading: false }));
    }
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [siswaRes, guruRes, mapelRes] = await Promise.all([
        supabase.from('data_siswa').select('*', { count: 'exact', head: true }),
        supabase.from('data_guru').select('*', { count: 'exact', head: true }),
        supabase.from('mata_pelajaran').select('*', { count: 'exact', head: true })
      ])
      setDataStats({
        siswa: siswaRes.count || 0,
        guru: guruRes.count || 0,
        mapel: mapelRes.count || 0
      })
    } catch (error) { console.error(error) } 
    finally { setLoading(false) }
  }

  // --- LOGIKA VISUAL ---
  const hour = time.getHours()
  const isNight = hour < 5 || hour >= 18

  const getWeatherVisuals = () => {
    const code = weather.weatherCode;
    if (code === 0) {
      return isNight 
        ? { icon: <Moon className="w-10 h-10 text-indigo-400" />, bg: "from-indigo-900/20 to-slate-900/30" }
        : { icon: <Sun className="w-10 h-10 text-amber-400" />, bg: "from-amber-500/10 to-blue-500/10" };
    }
    if ([1, 2, 3].includes(code)) return { icon: <CloudSun className="w-10 h-10 text-orange-400" />, bg: "from-orange-400/10 to-sky-500/10" };
    if ([45, 48, 51, 53, 55].includes(code)) return { icon: <Cloud className="w-10 h-10 text-slate-300" />, bg: "from-slate-500/10 to-slate-700/10" };
    if ([61, 63, 65, 80, 81, 82].includes(code)) return { icon: <CloudRain className="w-10 h-10 text-blue-500" />, bg: "from-blue-600/10 to-indigo-900/20" };
    if ([95, 96, 99].includes(code)) return { icon: <CloudLightning className="w-10 h-10 text-yellow-500" />, bg: "from-purple-900/20 to-slate-900" };
    return { icon: <CloudSun className="w-10 h-10 text-primary" />, bg: "from-primary/10 to-transparent" };
  }

  const { icon: WeatherIcon, bg: bgGradient } = getWeatherVisuals();
  const greeting = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

  const stats = [
    { title: "Total Siswa", val: dataStats.siswa.toLocaleString('id-ID'), icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
    { title: "Total Guru", val: dataStats.guru.toLocaleString('id-ID'), icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-500/10" },
    { title: "Mata Pelajaran", val: dataStats.mapel.toLocaleString('id-ID'), icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { title: "Log Sistem", val: "Active", icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-500/10" },
  ]

  // --- 2. CEK MOUNTING ---
  // Jika belum mounted (SSR), jangan render konten dinamis agar tidak Mismatch
  if (!mounted) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary/20" />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 ">
      
      {/* WIDGET CUACA */}
      <div className={`relative overflow-hidden p-6 md:p-8 rounded-[3.5rem] bg-gradient-to-br ${bgGradient} border border-white/10 backdrop-blur-md shadow-2xl transition-all duration-1000`}>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="p-4 md:p-5 bg-white/10 rounded-[2.2rem] backdrop-blur-xl shadow-inner border border-white/20">
              {weather.loading ? <Loader2 className="w-10 h-10 animate-spin opacity-20" /> : WeatherIcon}
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none ">
                {greeting}, <span className="text-primary text-shadow-glow">Admin</span>
              </h2>
              <div className="flex items-center gap-3 mt-4 opacity-70">
                <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  <Thermometer className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black uppercase ">{weather.temp}°C</span>
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  <Wind className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black uppercase ">{weather.wind} km/h</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest ml-1 hidden sm:inline ">{weather.city}, Kab. Bandung</span>
              </div>
            </div>
          </div>

          <div className="text-center md:text-right flex flex-col items-center md:items-end">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] ">Live Server Time</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-none tabular-nums ">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h3>
            <p className="text-[10px] font-black uppercase opacity-40 mt-2 tracking-widest ">
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* HEADER & RINGKASAN DATA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight truncate uppercase ">
            Ringkasan <span className="text-primary text-shadow-glow">Data</span>
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1 truncate font-bold ">
            Selamat datang kembali di panel kendali LENTERA.
          </p>
        </div>
        <div className="flex shrink-0">
           <div className="bg-primary/10 text-primary px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black flex items-center gap-2 border border-primary/20 ">
              <Zap className="w-3 h-3 fill-primary shrink-0" />
              <span className="uppercase tracking-wider">Sistem Normal</span>
           </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s) => (
          <Card key={s.title} className="border-none shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-1 active:scale-[0.98] rounded-[2rem]">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate ">{s.title}</p>
                  <h3 className="text-2xl md:text-4xl font-black mt-1 tracking-tighter text-foreground truncate leading-none ">
                    {loading && s.title !== "Log Sistem" ? <Loader2 className="w-6 h-6 animate-spin opacity-20" /> : s.val}
                  </h3>
                </div>
                <div className={`${s.bg} p-2.5 md:p-4 rounded-2xl transition-transform group-hover:rotate-12 shrink-0 shadow-inner`}>
                  <s.icon className={`w-5 h-5 md:w-7 md:h-7 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AREA KONTEN BAWAH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-card/40 border rounded-[3rem] p-6 md:p-8 min-h-[280px] md:min-h-[350px] flex flex-col items-center justify-center border-dashed relative overflow-hidden backdrop-blur-md shadow-2xl shadow-primary/5 ">
            <Activity className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/30 mb-4 animate-pulse" />
            <h4 className="font-black text-base md:text-lg text-foreground text-center uppercase tracking-tight ">Visualisasi Data Belum Tersedia</h4>
            <p className="text-xs md:text-sm text-muted-foreground max-w-[280px] md:max-w-sm mx-auto mt-2 text-center leading-relaxed font-bold opacity-60 ">
              Grafik perkembangan nilai dan statistik kelulusan akan muncul di sini setelah sinkronisasi data rapor dilakukan oleh Wali Kelas.
            </p>
         </div>

         <div className="bg-card/40 border rounded-[3rem] p-5 md:p-8 shadow-xl backdrop-blur-md ">
            <h4 className="font-black text-sm md:text-base mb-6 flex items-center gap-2 uppercase tracking-tighter ">
               <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shrink-0"></span>
               Info Terkini
            </h4>
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-primary/5 pb-4 last:border-0 last:pb-0 group">
                     <p className="text-[10px] font-black text-primary mb-1 tracking-[0.2em] uppercase ">PENGUMUMAN</p>
                     <p className="text-xs md:text-sm font-black leading-relaxed text-foreground/90 group-hover:text-primary transition-colors ">
                        Persiapan input nilai semester genap 2025/2026.
                     </p>
                  </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  )
}