import type { Metadata } from "next";
// Ganti Geist dengan Plus_Jakarta_Sans yang lebih nyaman di mata
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LENTERA - Sistem Administrasi Terpadu",
  description: "Satu cahaya untuk semua administrasi sekolah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // Menggunakan variabel font Jakarta Sans yang baru
      className={`${jakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          // Kita set false agar efek "Flow" di background tetap jalan
          disableTransitionOnChange={false}
          themes={['light', 'dark', 'read']}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}