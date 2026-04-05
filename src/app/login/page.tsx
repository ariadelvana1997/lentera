"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Loader2 } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    // 1. Proses Login Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErrorMsg("Email atau kata sandi salah.")
      setLoading(false)
      return
    }

    try {
      // 2. AMBIL ROLE ASLI DARI TABEL PROFILES
      // Ini bagian paling penting supaya navigasi gak nyasar
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        throw new Error("Data profil tidak ditemukan di database.")
      }

      // 3. LOGIKA NAVIGASI BERDASARKAN ROLE (Bukan Tulisan Email)
      const userRoles = profile.roles || []

      if (userRoles.includes("Admin")) {
        window.location.href = "/admin/pengguna" // Gunakan window.location agar refresh total
      } else if (userRoles.includes("Walikelas")) {
        window.location.href = "/walikelas"
      } else if (userRoles.includes("Guru")) {
        window.location.href = "/guru"
      } else if (userRoles.includes("Siswa")) {
        window.location.href = "/siswa"
      } else {
        window.location.href = "/dashboard" // Fallback
      }

    } catch (err: any) {
      setErrorMsg(err.message)
      setLoading(false)
      // Opsional: Logout jika profil gagal diambil agar tidak nanggung
      await supabase.auth.signOut()
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6 md:p-8 relative overflow-hidden transition-colors duration-1000 ease-in-out">
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>

      <div 
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-10 transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `radial-gradient(circle at center, var(--border) 1.5px, transparent 1.5px)`,
          backgroundSize: '24px 24px',
          maskImage: `radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent 100%)`
        }}
      />

      <div className="w-full max-w-[400px] z-10">
        <Card className="relative w-full border-none shadow-none bg-transparent sm:bg-card/40 sm:backdrop-blur-md sm:p-2 sm:rounded-3xl transition-colors duration-1000">
          <CardHeader className="space-y-3 text-center pb-6 md:pb-8">
            <div className="flex justify-center">
              <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-none">
                <Flame className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
            </div>
            
            <div className="space-y-1">
              <CardTitle className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                LENTERA
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm md:text-base px-4">
                (Layanan Elektronik Nilai Terpadu dan Rapor Akademik)
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5">
              {errorMsg && (
                <div className="text-[13px] font-medium text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center animate-in fade-in zoom-in duration-200">
                  {errorMsg}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-semibold text-sm ml-1">
                  Email
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nama@sekolah.id" 
                  className="bg-muted/50 border-input focus:bg-background transition-all duration-500 rounded-xl h-12 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-foreground font-semibold text-sm ml-1">
                  Kata Sandi
                </Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="bg-muted/50 border-input focus:bg-background transition-all duration-500 rounded-xl h-12 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl transition-all shadow-lg active:scale-[0.98] mt-2" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  "Masuk"
                )}
              </Button>
            </CardContent>
          </form>

          <div className="mt-3 text-center">
            <p className="text-[10px] md:text-xs text-muted-foreground font-bold tracking-[0.2em] uppercase">
              Dibuat Oleh DELVANA Bersama Ceui Ai
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}