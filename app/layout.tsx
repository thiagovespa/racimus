import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { I18nProvider } from "@/lib/i18n/context"
import { MatrixProvider } from "@/lib/store/matrix-store"
import { ThemeProvider } from "@/lib/theme/context"

import { Inter, JetBrains_Mono, Roboto as V0_Font_Roboto, Roboto_Mono as V0_Font_Roboto_Mono, Noto_Serif as V0_Font_Noto_Serif } from 'next/font/google'

// Initialize fonts
const _roboto = V0_Font_Roboto({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _robotoMono = V0_Font_Roboto_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700"] })
const _notoSerif = V0_Font_Noto_Serif({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })

const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Racimus - RACI Matrix Management | Vesparium",
  description:
    "Crie e gerencie matrizes RACI para seus projetos. Defina responsabilidades de forma clara e eficiente com nossa ferramenta intuitiva. Um produto Vesparium.",
  keywords: [
    "RACI",
    "matriz",
    "responsabilidades",
    "gestão de projetos",
    "accountability",
    "consulted",
    "informed",
    "responsible",
    "Vesparium",
    "Racimus",
  ],
  authors: [{ name: "Vesparium" }],
  creator: "Vesparium",
  publisher: "Vesparium",
  metadataBase: new URL("https://racim.us"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://racim.us",
    siteName: "Racimus",
    title: "Racimus - Gestão de Matrizes RACI | Vesparium",
    description:
      "Crie e gerencie matrizes RACI para seus projetos. Defina responsabilidades de forma clara e eficiente com nossa ferramenta intuitiva.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Racimus - RACI Matrix Management by Vesparium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Racimus - Gestão de Matrizes RACI | Vesparium",
    description:
      "Crie e gerencie matrizes RACI para seus projetos. Defina responsabilidades de forma clara e eficiente.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.jpg",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`font-sans antialiased ${inter.className}`}>
        <ThemeProvider>
          <I18nProvider>
            <MatrixProvider>{children}</MatrixProvider>
          </I18nProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
