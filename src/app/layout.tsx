import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/lib/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FarmerConnect — Farm to Table Marketplace',
  description: 'Connect directly with verified farmers. Fresh produce at fair prices, straight from the field.',
  keywords: ['farmer', 'fresh produce', 'organic', 'marketplace', 'agriculture', 'India'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-[family-name:var(--font-inter)]`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
