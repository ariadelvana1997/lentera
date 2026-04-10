'use server'

import { createClient } from '@supabase/supabase-js'

export async function registerUserAction(formData: any) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Pakai key rahasia
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { nama, email, password, roles } = formData

  // 1. Daftarkan ke Supabase Auth (Sistem Login)
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Langsung aktif tanpa verifikasi email
    user_metadata: { nama_lengkap: nama, role: roles[0] } 
  })

  if (authError) return { success: false, message: authError.message }

  // 2. Masukkan ke tabel profiles pakai ID yang didapat dari Auth
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([{
      id: authUser.user.id, // ID asli dari auth.users
      nama_lengkap: nama,
      email,
      roles,
      created_at: new Date()
    }])

  if (profileError) return { success: false, message: profileError.message }

  // --- PERUBAHAN DI SINI: Mengembalikan data user agar ID bisa dibaca frontend ---
  return { success: true, user: authUser.user }
}