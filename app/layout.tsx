import type React from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import { getTenantConfig } from "@/lib/tenants"
import "./globals.css"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
})

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
})

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME || "Worqera"} - Sistema de Gestão`,
  description: "Sistema de gestão para loja de reforma de tênis"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const hdrs = headers();
  const tenantSlug = hdrs.get("x-tenant") || undefined;
  const tenant = getTenantConfig(tenantSlug);

  const themeStyle: React.CSSProperties = {
    // Variáveis de marca para temas futuros
    ["--brand-primary" as any]: tenant.theme.primary,
    ["--brand-accent" as any]: tenant.theme.accent,
    ["--brand-bg" as any]: tenant.theme.background,
    ["--brand-text" as any]: tenant.theme.text,
    ["--brand-muted" as any]: tenant.theme.muted || "#e2e8f0",
  };

  return (
    <html lang="pt-BR" className={`${playfairDisplay.variable} ${sourceSans.variable}`}>
      <body
        className="font-sans antialiased"
        data-tenant={tenant.slug}
        data-tenant-name={tenant.displayName}
        style={themeStyle}
      >
        {children}
      </body>
    </html>
  )
}
