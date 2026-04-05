"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg("Email atau Password salah!")
      setLoading(false)
    } else {
      router.push("/") // Pindah ke dashboard jika sukses
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
             <div className="bg-slate-900 text-white p-2 rounded-lg font-bold text-xl px-4">L</div>
          </div>
          <CardTitle className="text-2xl text-center font-bold tracking-tight">Selamat Datang di LENTERA</CardTitle>
          <CardDescription className="text-center">
            Masukkan akun admin atau guru Anda
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md text-center">
                {errorMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@sekolah.id" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-slate-900 hover:bg-slate-800" type="submit" disabled={loading}>
              {loading ? "Sedang Masuk..." : "Masuk ke Sistem"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}