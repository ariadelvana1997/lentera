"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { dictionary, LangCode } from '@/constants/dictionary'

// Definisi tipe data biar TypeScript nggak marah
type LanguageContextType = {
  lang: LangCode
  setLang: (lang: LangCode) => void
  t: any
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangCode>('id')

  // Load bahasa dari localStorage pas pertama kali buka
  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as LangCode
    if (savedLang) {
      setLang(savedLang)
    }
  }, [])

  // Fungsi buat ganti bahasa sekaligus simpan ke storage
  const handleSetLang = (newLang: LangCode) => {
    setLang(newLang)
    localStorage.setItem('app_lang', newLang)
  }

  // Ambil data dictionary sesuai bahasa yang aktif
  const t = dictionary[lang] || dictionary.id

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook biar manggilnya gampang di page lain
export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useTranslation harus digunakan di dalam LanguageProvider')
  }
  return context
}