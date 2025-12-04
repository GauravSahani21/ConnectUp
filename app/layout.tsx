import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AppProvider } from "@/context/app-context"
import { SocketProvider } from "@/context/socket-context"
import { CallProvider } from "@/context/call-context"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ConnectUp",
  description: "Connect with friends instantly - Real-time messaging, calls, and more",
  generator: "v0.app",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" fontSize="90" fill="%2325D366">💬</text></svg>',
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#075E54",
}

const _geistMono = Geist_Mono({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <AppProvider>
          <SocketProvider>
            <CallProvider>
              {children}
              <Toaster />
            </CallProvider>
          </SocketProvider>
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
