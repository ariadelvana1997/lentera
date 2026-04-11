"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Users, Star, Zap, Loader2, CloudSun, Sun, Moon, 
  Activity, ClipboardCheck, Printer, Calendar
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function WaliKelasPage() {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState({ temp: 0, weatherCode: 0, city: "Cicalengka", loading: true })
  const [stats, setStats] = useState({ siswa: 0, ekskul: 0, rapor: 0 })
  const [teacherName, setTeacherName] = useState("")

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    fetchData()
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('data_guru').select('nama_lengkap').eq('email', user.email).single()
        if (profile) setTeacherName(profile.nama_lengkap)

        // Mock Stats (Sesuaikan dengan query table kamu nantinya)
        const [s, e] = await Promise.all([
          supabase.from('data_siswa').select('*', { count: 'exact', head: true }),
          supabase.from('data_ekstrakurikuler').select('*', { count: 'exact', head: true })
        ])
        setStats({ siswa: s.count || 0, ekskul: e.count || 0, rapor: 0 })
      }
      
      // Weather Fetch
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=-6.9944&longitude=107.8344&current=temperature_2m,weather_code&timezone=auto`);
      const weatherData = await res.json();
      if (weatherData.current) setWeather({ temp: Math.round(weatherData.current.temperature_2m), weatherCode: weatherData.current.weather_code, city: "Cicalengka", loading: false });
    } catch (e) { console.error(e) }
  }

  const hour = time.getHours()
  const greeting = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      {/* WIDGET CUACA SULTAN */}
      <div className="relative overflow-hidden p-8 rounded-[3.5rem] bg-gradient-to-br from-primary/10 to-blue-500/10 border border-white/10 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-white/10 rounded-[2.2rem] border border-white/20">
              {weather.loading ? <Loader2 className="animate-spin opacity-20" /> : <CloudSun className="w-10 h-10 text-primary" />}
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                {greeting}, <span className="text-primary text-shadow-glow">{teacherName.split(' ')[0] || "Wali Kelas"}</span>
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-3">Panel Koordinasi Kelas & Evaluasi Siswa</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter tabular-nums leading-none">{time.toLocaleTimeString('id-ID')}</h3>
            <p className="text-[10px] font-black uppercase opacity-40 mt-2 tracking-widest">{weather.city}, {weather.temp}°C</p>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Siswa Perwalian" val={stats.siswa} icon={<Users />} color="text-blue-600" bg="bg-blue-500/10" />
        <StatsCard title="Rapor Terbit" val={stats.rapor} icon={<Printer />} color="text-emerald-600" bg="bg-emerald-500/10" />
        <StatsCard title="Ko-Kurikuler" val={stats.ekskul} icon={<Star />} color="text-amber-600" bg="bg-amber-500/10" />
        <StatsCard title="Status Absensi" val="Aktif" icon={<Calendar />} color="text-purple-600" bg="bg-purple-500/10" />
      </div>

      {/* PLACEHOLDER GRAFIK */}
      <div className="bg-card/40 border rounded-[3rem] p-12 flex flex-col items-center justify-center border-dashed backdrop-blur-sm">
         <Activity className="w-12 h-12 text-muted-foreground/20 mb-4 animate-pulse" />
         <h4 className="font-black uppercase  text-muted-foreground/60 tracking-widest text-sm">Statistik Kelas Belum Tersedia</h4>
      </div>
    </div>
  )
}

function StatsCard({ title, val, icon, color, bg }: any) {
  return (
    <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all">
      <CardContent className="p-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-black mt-1">{val}</h3>
        </div>
        <div className={`${bg} ${color} p-4 rounded-2xl shadow-inner group-hover:rotate-12 transition-transform`}>{icon}</div>
      </CardContent>
    </Card>
  )
}