"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import MaintenanceScreen from "./maintenance-screen"

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single()

        if (data) {
          setIsMaintenance(data.value === 'true')
        }
      } catch (e) {
        console.error("Gagal cek status maintenance:", e)
      } finally {
        setLoading(false)
      }
    }

    fetchMaintenanceStatus()

    // --- PERBAIKAN DI SINI: Gunakan ID Unik agar tidak bentrok ---
    const channelId = `maintenance_check_${Math.random().toString(36).substring(7)}`
    
    const channel = supabase
      .channel(channelId) // Nama channel sekarang unik tiap render
      .on(
        'postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'app_settings',
          filter: 'key=eq.maintenance_mode' // Tambahkan filter biar lebih spesifik
        }, 
        (payload) => {
          setIsMaintenance(payload.new.value === 'true')
        }
      )
      .subscribe()

    return () => {
      // Pastikan channel dihapus saat component unmount
      supabase.removeChannel(channel)
    }
  }, [])

  const isAdminPath = pathname.startsWith('/admin')
  
  if (!loading && isMaintenance && !isAdminPath) {
    return <MaintenanceScreen />
  }

  return <>{children}</>
}