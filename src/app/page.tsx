import { redirect } from "next/navigation"; // Impor navigasi
import { supabase } from '@/lib/supabase'

export default async function Home() {
  // 1. LOGIKA REDIRECT: Langsung lempar ke /login
  // Perintah ini akan dieksekusi pertama kali, sehingga UI di bawah tidak akan muncul di root (/)
  redirect("/login");

  
}