// Definisi struktur agar tidak ada yang terlewat
interface DictionaryEntry {
  title: string;
  desc: string;
  save: string;
  app_name_label: string;
  lang_label: string;
  font_label: string;
  maintenance_label: string;
  maintenance_desc: string;
  notif_label: string;
  notif_desc: string;
  success_msg: string;
}

export const dictionary: Record<string, DictionaryEntry> = {
  id: {
    title: "PENGATURAN SISTEM",
    desc: "KONFIGURASI IDENTITAS & PERILAKU APLIKASI",
    save: "SIMPAN PERUBAHAN",
    app_name_label: "NAMA APLIKASI",
    lang_label: "VARIAN BAHASA SISTEM",
    font_label: "PILIH FONT UTAMA",
    maintenance_label: "MODE MAINTENANCE",
    maintenance_desc: "JIKA AKTIF, PENGGUNA SELAIN ADMIN TIDAK DAPAT AKSES APLIKASI.",
    notif_label: "NOTIFIKASI EMAIL",
    notif_desc: "KIRIM NOTIFIKASI OTOMATIS SAAT ADA PERUBAHAN DATA PENTING.",
    success_msg: "PENGATURAN BERHASIL DIPERBARUI!",
  },
  en: {
    title: "SYSTEM SETTINGS",
    desc: "APP IDENTITY & BEHAVIOR CONFIGURATION",
    save: "SAVE CHANGES",
    app_name_label: "APP NAME",
    lang_label: "SYSTEM LANGUAGE VARIANT",
    font_label: "PRIMARY FONT FAMILY",
    maintenance_label: "MAINTENANCE MODE",
    maintenance_desc: "IF ACTIVE, NON-ADMIN USERS CANNOT ACCESS THE APP.",
    notif_label: "EMAIL NOTIFICATIONS",
    notif_desc: "SEND AUTOMATIC NOTIFICATIONS ON IMPORTANT DATA CHANGES.",
    success_msg: "SETTINGS UPDATED SUCCESSFULLY!",
  },
  sun: {
    title: "SETÉLAN SISTEM",
    desc: "KONFIGURASI IDENTITAS SARENG PARIPOLAH APLIKASI",
    save: "SIMPEN PAROBAHAN",
    app_name_label: "NAMA APLIKASI",
    lang_label: "BASA SISTEM",
    font_label: "PILIH FONT UTAMA",
    maintenance_label: "MODE NGAROPÉA",
    maintenance_desc: "UPAMI AKTIF, SALIAN TI ADMIN TEU TIASA LEBET KA APLIKASI.",
    notif_label: "NOTIFIKASI EMAIL",
    notif_desc: "KIRIM NOTIFIKASI OTOMATIS SAAT AYA PAROBAHAN DATA PENTING.",
    success_msg: "SETÉLAN PARANTOS DIROBI!",
  },
  alay: {
    title: "p3ng4tur4n sYst3m",
    desc: "kOnfIgUr4sI Id3ntIt4s & p3rIl4kU 4pLIk4sI",
    save: "sImp4n p3rub4h4n",
    app_name_label: "n4m4 4pLIk4sI",
    lang_label: "v4rI4n b4h4s4 sYst3m",
    font_label: "pIL1h f0nt ut4m4",
    maintenance_label: "m0d3 m4Int3n4nc3",
    maintenance_desc: "kL0 4ktIf, yAnG bUkAn 4dmIn gAk bIs4 mAsUk 4pLIk4sI.",
    notif_label: "n0tIfIk4sI 3m4IL",
    notif_desc: "kIrIm n0tIfIk4sI 0t0m4tIs kLo 4d4 p3rub4h4n d4t4 p3ntInG.",
    success_msg: "p3ng4tur4n b3rh4sIL dIUpd4t3!",
  },
  jaksel: {
    title: "SYSTEM SETTINGS LITERALLY",
    desc: "APP IDENTITY & BEHAVIOR CONFIGURATION WHICH IS IMPORTANT",
    save: "SAVE CHANGES, PERIOD.",
    app_name_label: "APP NAME (WHICH IS...)",
    lang_label: "SYSTEM LANGUAGE VARIANT, HONESTLY",
    font_label: "PRIMARY FONT, WHICH IS COOL",
    maintenance_label: "MAINTENANCE MODE, PRETTY MUCH",
    maintenance_desc: "IF ACTIVE, OTHERS CAN'T ACCESS, WHICH IS SO SAD.",
    notif_label: "EMAIL NOTIFICATIONS, BASICALLY",
    notif_desc: "SEND AUTO NOTIF WHEN SOMETHING IMPORTANT HAPPENS.",
    success_msg: "WHICH IS... UPDATED SUCCESSFULLY!",
  }
}

export type LangCode = keyof typeof dictionary;