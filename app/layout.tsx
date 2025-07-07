import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GPX Merger Online - Combine GPS Tracks & TCX Files Free",
  description:
    "Free online GPX merger tool. Combine up to 6 GPX and TCX files into one GPS track. Professional GPS file combiner for athletes, cyclists, and runners. No registration required.",
  keywords:
    "GPX merger, TCX merger, GPS file combiner, merge GPX files, combine GPS tracks, GPS track merger, TCX file combiner, merge running tracks, cycling GPS merger, GPS data combiner, track file merger",
  authors: [{ name: "GPX Merger Online" }],
  creator: "GPX Merger Online",
  publisher: "GPX Merger Online",
  robots: "index, follow",
  openGraph: {
    title: "GPX Merger Online - Combine GPS Tracks & TCX Files Free",
    description:
      "Professional free tool to merge GPX and TCX files. Combine multiple GPS tracks into one route for enhanced analysis.",
    type: "website",
    locale: "en_US",
    siteName: "GPX Merger Online",
  },
  twitter: {
    card: "summary_large_image",
    title: "GPX Merger Online - Combine GPS Tracks & TCX Files Free",
    description: "Free professional tool to merge GPX and TCX files. Combine multiple GPS tracks into one route.",
  },
  alternates: {
    canonical: "https://gpx-merger-online.com",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://gpx-merger-online.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f97316" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
