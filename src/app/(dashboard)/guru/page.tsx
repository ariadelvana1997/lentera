"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Users, BookOpen, FileText, Zap, Loader2, CloudSun, Sun, Moon, 
  Activity
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function GuruPage() {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState({ temp: 0, wind: 0, weatherCode: 0, city: "Cicalengka", loading: true })
  const [stats, setStats] = useState({ mapel: 0, siswa: 0 })
  
  // --- STATE NAMA GURU ---
  const [teacherName, setTeacherName] = useState("")

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    fetchData()
    fetchWeather() 
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      // 1. Ambil info user yang sedang login
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // 2. Ambil Nama Lengkap dari tabel data_guru (atau profiles)
        const { data: guruProfile } = await supabase
          .from('data_guru')
          .select('nama_lengkap')
          .eq('email', user.email)
          .single()
        
        if (guruProfile) {
          // Kita ambil nama depannya saja atau nama lengkap
          setTeacherName(guruProfile.nama_lengkap)
        }

        // 3. Ambil Stats Dasar
        const [m, s] = await Promise.all([
          supabase.from('mata_pelajaran').select('*', { count: 'exact', head: true }),
          supabase.from('data_siswa').select('*', { count: 'exact', head: true })
        ])
        setStats({ mapel: m.count || 0, siswa: s.count || 0 })
      }
    } catch (e) { console.error(e) }
  }

  const fetchWeather = async () => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=-6.9944&longitude=107.8344&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`);
      const data = await res.json();
      if (data.current) {
        setWeather({ temp: Math.round(data.current.temperature_2m), wind: Math.round(data.current.wind_speed_10m), weatherCode: data.current.weather_code, city: "Cicalengka", loading: false });
      }
    } catch (e) { setWeather(prev => ({ ...prev, loading: false })) }
  }

  const hour = time.getHours()
  const isNight = hour < 5 || hour >= 18
  const getVisuals = () => {
    const code = weather.weatherCode;
    if (code === 0) return isNight ? { icon: <Moon className="w-10 h-10 text-indigo-400" />, bg: "from-indigo-900/20 to-slate-900/30" } : { icon: <Sun className="w-10 h-10 text-amber-400" />, bg: "from-amber-500/10 to-blue-500/10" };
    return { icon: <CloudSun className="w-10 h-10 text-orange-400" />, bg: "from-orange-400/10 to-sky-500/10" };
  }

  const { icon: WeatherIcon, bg: bgGradient } = getVisuals();
  const greeting = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      {/* WIDGET CUACA */}
      <div className={`relative overflow-hidden p-8 rounded-[3.5rem] bg-gradient-to-br ${bgGradient} border border-white/10 backdrop-blur-md shadow-2xl transition-all duration-1000`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-white/10 rounded-[2.2rem] border border-white/20 shadow-inner">
              {weather.loading ? <Loader2 className="animate-spin opacity-20" /> : WeatherIcon}
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none ">
                {/* --- BAGIAN YANG DIUBAH --- */}
                {greeting}, <span className="text-primary text-shadow-glow">{teacherName || "Guru"}</span>
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-3 ">Panel Pengajar Akademik LENTERA</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-none tabular-nums ">
              {time.toLocaleTimeString('id-ID')}
            </h3>
            <p className="text-[10px] font-black uppercase opacity-40 mt-2 tracking-widest ">{weather.city}, {weather.temp}°C</p>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Mata Pelajaran" val={stats.mapel} icon={<BookOpen />} color="text-blue-600" bg="bg-blue-500/10" />
        <StatsCard title="Total Siswa" val={stats.siswa} icon={<Users />} color="text-emerald-600" bg="bg-emerald-500/10" />
        <StatsCard title="Input Penilaian" val="Ready" icon={<FileText />} color="text-amber-600" bg="bg-amber-500/10" />
        <StatsCard title="Status Server" val="Online" icon={<Zap />} color="text-purple-600" bg="bg-purple-500/10" />
      </div>

      <div className="bg-card/40 border rounded-[3rem] p-12 flex flex-col items-center justify-center border-dashed backdrop-blur-sm">
         <Activity className="w-12 h-12 text-muted-foreground/20 mb-4 animate-pulse" />
         <h4 className="font-black uppercase  text-muted-foreground/60 tracking-widest text-sm">Dashboard Akademik Siap</h4>
      </div>
    </div>
  )
}

function StatsCard({ title, val, icon, color, bg }: any) {
  return (
    <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all">
      <CardContent className="p-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ">{title}</p>
          <h3 className="text-3xl font-black mt-1 ">{val}</h3>
        </div>
        <div className={`${bg} ${color} p-4 rounded-2xl group-hover:rotate-12 transition-transform shadow-inner`}>{icon}</div>
      </CardContent>
    </Card>
  )
}