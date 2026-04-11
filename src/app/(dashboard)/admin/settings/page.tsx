"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes" 
import { supabase } from "@/lib/supabase"
import { dictionary, LangCode } from "@/constants/dictionary"
import { fontOptions } from "@/constants/fonts" 
import { 
  Settings, Save, Type, Languages, 
  Activity, Monitor, ShieldAlert, Loader2,
  Smartphone, BellRing, Palette 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area" 
import {
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"

// 1. DEFINISI INTERFACE
interface AppConfig {
  app_name: string;
  font_family: string;
  language: LangCode;
  maintenance_mode: boolean;
  notifications: boolean;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme() 
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  
  // 2. STATE AWAL
  const [config, setConfig] = useState<AppConfig>({
    app_name: "LENTERA APP",
    font_family: "font-jakarta-sans", 
    language: "id" as LangCode,
    maintenance_mode: false,
    notifications: true
  })

  const t = dictionary[config.language] || dictionary.id

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      
      if (error) throw error;

      if (data && data.length > 0) {
        const newConfig = { ...config };
        data.forEach((item: any) => {
          if (Object.prototype.hasOwnProperty.call(newConfig, item.key)) {
            const key = item.key as keyof AppConfig;
            
            let finalValue = item.value;
            if (finalValue === 'true') finalValue = true;
            if (finalValue === 'false') finalValue = false;
            
            (newConfig[key] as any) = finalValue;
          }
        });
        setConfig(newConfig);
        
        const fontVar = `var(--${newConfig.font_family})`;
        document.documentElement.style.setProperty('--font-app-dynamic', fontVar);
      }
    } catch (err: any) {
      console.error("Gagal load settings:", err.message || err);
    } finally {
      setFetching(false);
    }
  };

  // --- FUNGSI LIVE PREVIEW FONT ---
  const handleFontChange = (newFont: string) => {
    setConfig({ ...config, font_family: newFont });
    const fontVarValue = `var(--${newFont})`;
    document.documentElement.style.setProperty('--font-app-dynamic', fontVarValue);
    
    fontOptions.forEach((opt) => document.documentElement.classList.remove(opt.value));
    document.documentElement.classList.add(newFont);
  };

  // --- FUNGSI SAVE KE SUPABASE ---
  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = Object.entries(config).map(([key, value]) => {
        return supabase
          .from('app_settings')
          .upsert({ 
            key: key, 
            value: value.toString(), 
            updated_at: new Date() 
          });
      });

      const results = await Promise.all(updates);
      const hasError = results.some(res => res.error);
      if (hasError) throw new Error("Beberapa pengaturan gagal disimpan");

      localStorage.setItem('app_name', config.app_name);
      localStorage.setItem('app_lang', config.language);
      localStorage.setItem('app_font', config.font_family);

      toast.success(t.success_msg);

      if (config.maintenance_mode) {
        toast.warning("Mode Maintenance Aktif! Hanya Admin yang bisa mengakses aplikasi.");
      }

      setTimeout(() => {
        if (confirm("Pengaturan disimpan. Refresh halaman untuk sinkronisasi total?")) {
          window.location.reload();
        }
      }, 500);

    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 ">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-3 uppercase ">
            <Settings className="w-8 h-8 text-primary" /> {t.title}
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest leading-none mt-1 ">
            {t.desc}
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          className="rounded-xl font-black h-12 px-8 shadow-xl shadow-primary/20 uppercase tracking-widest "
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {t.save}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. UMUM & IDENTITAS */}
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <Monitor className="w-5 h-5" />
            <h3 className="font-black uppercase text-sm tracking-widest ">Identity Info</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-60 ">{t.app_name_label}</Label>
              <Input 
                value={config.app_name}
                onChange={(e) => setConfig({...config, app_name: e.target.value})}
                className="rounded-2xl border-none bg-white shadow-sm h-12 font-black text-sm uppercase "
                placeholder={t.app_name_label}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-60 ">{t.lang_label}</Label>
              <Select 
                value={config.language} 
                onValueChange={(v: LangCode) => setConfig({...config, language: v})}
              >
                <SelectTrigger className="rounded-2xl border-none bg-white shadow-sm h-12 font-bold text-xs uppercase ">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-primary" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="id" className="font-black ">🇮🇩 INDONESIA</SelectItem>
                  <SelectItem value="en" className="font-black ">🇺🇸 ENGLISH</SelectItem>
                  <SelectItem value="sun" className="font-black ">🥥 SUNDA</SelectItem>
                  <SelectItem value="alay" className="font-black ">🤘 4L4Y</SelectItem>
                  <SelectItem value="jaksel" className="font-black ">☕ JAKSEL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* 2. TAMPILAN (FONT - LIVE PREVIEW) */}
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <Type className="w-5 h-5" />
            <h3 className="font-black uppercase text-sm tracking-widest ">Typography Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-60 ">{t.font_label}</Label>
              <Select 
                value={config.font_family} 
                onValueChange={handleFontChange}
              >
                <SelectTrigger className="rounded-2xl border-none bg-white shadow-sm h-12 font-bold text-xs uppercase ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <ScrollArea className="h-80">
                    {fontOptions.map((font) => (
                      <SelectItem 
                        key={font.value} 
                        value={font.value} 
                        className={`font-black ${font.value} cursor-pointer `}
                      >
                        {font.name}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold leading-tight px-1 ">
              * Pilih font untuk melihat perubahan langsung. Klik SIMPAN untuk menetapkan secara permanen.
            </p>
          </div>
        </Card>

        {/* 3. ATMOSPHERE (THEME - 8 VARIAN) */}
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <Palette className="w-5 h-5" />
            <h3 className="font-black uppercase text-sm tracking-widest ">Atmosphere Settings</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'light', name: 'Cloud White', color: 'bg-slate-100' },
              { id: 'dark', name: 'Space Gray', color: 'bg-slate-800' },
              { id: 'read', name: 'Sepia Paper', color: 'bg-orange-100' },
              { id: 'midnight', name: 'Midnight Onyx', color: 'bg-zinc-950 border border-white/20' },
              { id: 'amethyst', name: 'Royal Amethyst', color: 'bg-purple-900' },
              { id: 'emerald', name: 'Emerald Forest', color: 'bg-emerald-800' },
              { id: 'crimson', name: 'Sunset Crimson', color: 'bg-red-900' },
              { id: 'azure', name: 'Oceanic Azure', color: 'bg-blue-600' },
            ].map((thm) => (
              <button
                key={thm.id}
                onClick={() => setTheme(thm.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all border-2 ${
                  theme === thm.id ? 'border-primary bg-primary/10' : 'border-transparent bg-white shadow-sm hover:shadow-md'
                }`}
              >
                <div className={`w-6 h-6 rounded-full shrink-0 ${thm.color}`} />
                <span className="text-[10px] font-black uppercase  truncate">{thm.name}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* 4. SISTEM & KEAMANAN (MAINTENANCE MODE) */}
        <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm rounded-[2.5rem] p-8 lg:col-span-1">
          <div className="flex items-center gap-3 text-primary mb-8">
            <Activity className="w-5 h-5" />
            <h3 className="font-black uppercase text-sm tracking-widest ">System Control</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-start justify-between p-6 rounded-[2rem] bg-white shadow-sm border border-transparent hover:border-red-200 transition-all group">
              <div className="flex gap-4">
                <div className={`p-3 rounded-2xl ${config.maintenance_mode ? 'bg-red-500 text-white animate-pulse' : 'bg-green-100 text-green-600'}`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black uppercase text-xs ">{t.maintenance_label}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 max-w-[200px] ">
                    {t.maintenance_desc}
                  </p>
                </div>
              </div>
              <Switch 
                checked={config.maintenance_mode}
                onCheckedChange={(v) => {
                    setConfig({...config, maintenance_mode: v});
                    if(v) toast.error("PERHATIAN: Mode maintenance akan memblokir akses Guru!");
                }}
                className="data-[state=checked]:bg-red-500"
              />
            </div>

            <div className="flex items-start justify-between p-6 rounded-[2rem] bg-white shadow-sm border border-transparent hover:border-primary/20 transition-all">
              <div className="flex gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <BellRing className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black uppercase text-xs ">{t.notif_label}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 max-w-[200px] ">
                    {t.notif_desc}
                  </p>
                </div>
              </div>
              <Switch 
                checked={config.notifications}
                onCheckedChange={(v) => setConfig({...config, notifications: v})}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* FOOTER PREVIEW */}
      <div className="flex items-center justify-center pt-6 opacity-30 grayscale ">
         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ">
            <Smartphone className="w-4 h-4" /> Powered by {config.app_name} DELVANA & Ceu AI
         </div>
      </div>
    </div>
  )
}