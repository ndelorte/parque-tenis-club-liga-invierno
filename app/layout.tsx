import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { site } from "@/content/site"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: site.seo.home.title,
  description: site.seo.home.description,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  )
}
