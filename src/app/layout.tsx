import type { Metadata } from "next";
// Import Script untuk menangani logic font tanpa error React
import Script from "next/script";
// Import 30+ Font untuk LENTERA Multiverse
import { 
  Plus_Jakarta_Sans, Geist_Mono, Inter, Poppins, Montserrat, 
  Roboto, Open_Sans, Lato, Oswald, Raleway, Nunito, Ubuntu, 
  Playfair_Display, Lora, Kanit, Quicksand, Fira_Sans,
  Work_Sans, Bebas_Neue, Source_Sans_3, Merriweather, Josefin_Sans,
  Arvo, Libre_Baskerville, Anton, Dancing_Script, Pacifico,
  Caveat, Inconsolata, Comfortaa, Exo_2, Righteous
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import MaintenanceGuard from "../components/maintenance-guard";
import { LanguageProvider } from "@/context/language-context";

// --- 1. INISIALISASI FONT BAWAAN ---
const jakartaSans = Plus_Jakarta_Sans({ variable: "--font-jakarta-sans", subsets: ["latin"], display: 'swap' });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: 'swap' });

// --- 2. INISIALISASI 15 FONT PERTAMA ---
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({ weight: ['400', '700', '900'], subsets: ['latin'], variable: '--font-poppins', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' });
const roboto = Roboto({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-roboto', display: 'swap' });
const opensans = Open_Sans({ subsets: ['latin'], variable: '--font-opensans', display: 'swap' });
const lato = Lato({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-lato', display: 'swap' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });
const ubuntu = Ubuntu({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-ubuntu', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const kanit = Kanit({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-kanit', display: 'swap' });
const quicksand = Quicksand({ subsets: ['latin'], variable: '--font-quicksand', display: 'swap' });
const firasans = Fira_Sans({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-firasans', display: 'swap' });

// --- 3. INISIALISASI 15 FONT TAMBAHAN ---
const worksans = Work_Sans({ subsets: ['latin'], variable: '--font-worksans', display: 'swap' });
const bebasneue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebasneue', display: 'swap' });
const sourcesans = Source_Sans_3({ subsets: ['latin'], variable: '--font-sourcesans', display: 'swap' });
const merriweather = Merriweather({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-merriweather', display: 'swap' });
const josefinsans = Josefin_Sans({ subsets: ['latin'], variable: '--font-josefinsans', display: 'swap' });
const arvo = Arvo({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-arvo', display: 'swap' });
const librebaskerville = Libre_Baskerville({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-librebaskerville', display: 'swap' });
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
const dancing = Dancing_Script({ subsets: ['latin'], variable: '--font-dancing', display: 'swap' });
const pacifico = Pacifico({ weight: '400', subsets: ['latin'], variable: '--font-pacifico', display: 'swap' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap' });
const inconsolata = Inconsolata({ subsets: ['latin'], variable: '--font-inconsolata', display: 'swap' });
const comfortaa = Comfortaa({ subsets: ['latin'], variable: '--font-comfortaa', display: 'swap' });
const exo2 = Exo_2({ subsets: ['latin'], variable: '--font-exo2', display: 'swap' });
const righteous = Righteous({ weight: '400', subsets: ['latin'], variable: '--font-righteous', display: 'swap' });

export const metadata: Metadata = {
  title: "LENTERA - Sistem Administrasi Terpadu",
  description: "Satu cahaya untuk semua administrasi sekolah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Menggabungkan SEMUA variabel font agar tersedia secara global di CSS
  const allFontVariables = [
    jakartaSans.variable, geistMono.variable, inter.variable, poppins.variable,
    montserrat.variable, roboto.variable, opensans.variable, lato.variable,
    oswald.variable, raleway.variable, nunito.variable, ubuntu.variable,
    playfair.variable, lora.variable, kanit.variable, quicksand.variable, firasans.variable,
    worksans.variable, bebasneue.variable, sourcesans.variable, merriweather.variable,
    josefinsans.variable, arvo.variable, librebaskerville.variable, anton.variable,
    dancing.variable, pacifico.variable, caveat.variable, inconsolata.variable,
    comfortaa.variable, exo2.variable, righteous.variable
  ].join(" ");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${allFontVariables} h-full antialiased`}
    >
      <head>
        {/* Perbaikan Error Script Tag menggunakan Next.js Script component */}
        <Script id="font-loader-logic" strategy="beforeInteractive">
          {`
            (function() {
              try {
                const savedFont = localStorage.getItem('app_font') || 'font-jakarta-sans';
                document.documentElement.classList.add(savedFont);
                const fontVarValue = "var(--" + savedFont + ")";
                document.documentElement.style.setProperty('--font-app-dynamic', fontVarValue);
              } catch (e) {}
            })()
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col transition-all duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          themes={[
            'light', 
            'dark', 
            'read', 
            'midnight', 
            'amethyst', 
            'emerald', 
            'crimson', 
            'azure'
          ]}
        >
          <LanguageProvider>
            <MaintenanceGuard>
              {children}
            </MaintenanceGuard>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}