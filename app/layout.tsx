import type { Metadata, Viewport } from "next"
import { Barlow, Barlow_Condensed, Playfair_Display } from "next/font/google"
import "./globals.css"
import { CLUB } from "@/lib/site"
import { ThemeProvider } from "@/components/theme-provider"

// Tipografía (plan-refactor-visual.md §3.3): Barlow para texto, Barlow
// Condensed para títulos y marcadores. Playfair queda solo para Mid Master.
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  // Base para las URLs absolutas de metadata (links al compartir, íconos).
  metadataBase: new URL(CLUB.url),
  title: CLUB.name,
  description: CLUB.description,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1a13" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${barlow.variable} ${barlowCondensed.variable} ${playfair.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
