import { supabase } from '@/lib/supabase'

export default async function Home() {
  // Mengambil data dari tabel 'students' di Supabase
  const { data: students, error } = await supabase
    .from('students')
    .select('*')

  if (error) {
    return <div className="p-10 text-red-500">Gagal mengambil data: {error.message}</div>
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900">LENTERA</h1>
          <p className="text-slate-500">Sistem Administrasi Rapor & Kelulusan Terpadu</p>
        </header>

        <div className="grid gap-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Daftar Siswa Terbaru</h2>
            
            {students && students.length > 0 ? (
              <div className="divide-y">
                {students.map((siswa) => (
                  <div key={siswa.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-700">{siswa.nama_lengkap}</p>
                      <p className="text-sm text-slate-400">NISN: {siswa.nisn}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${siswa.status_kelulusan ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {siswa.status_kelulusan ? 'Lulus' : 'Aktif'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">Belum ada data siswa. Silakan tambah data di database Supabase.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}