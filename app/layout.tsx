import type React from "react"
import type { Metadata } from 'next';
import { Inter, Red_Hat_Display, Pacifico,Satisfy } from 'next/font/google';
import './globals.css';
import { ClientProviders } from './ClientProviders'; 

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
// Add other fonts if you use them globally

const pacifico = Pacifico({
  subsets: ['latin'],
  variable: '--font-pacifico',
  weight: "400"
})
const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-red-hat-display",
})


const SatisfyFont = Satisfy({
  subsets: ['latin'],
  variable: '--font-satisfy',
  weight: "400"
})


export const metadata: Metadata = {
  title: 'Mint Matrix',
  description: 'Register, manage, and trade your intellectual property assets on the blockchain.',
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${redHatDisplay.variable} ${SatisfyFont.variable} ${pacifico.variable}`}>

        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
