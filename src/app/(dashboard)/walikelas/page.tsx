export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-sans text-foreground">
        Selamat Datang, walikelas
      </h1>
      <p className="text-muted-foreground mt-2">
        Ini adalah pusat kendali aplikasi LENTERA.
      </p>
      
      {/* Nanti di sini kita buatkan statistik sekolah */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-6 bg-card border rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Siswa</p>
          <p className="text-3xl font-bold mt-1">1,240</p>
        </div>
        {/* Tambahkan card lainnya... */}
      </div>
    </div>
  )
}