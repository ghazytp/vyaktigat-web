import type { Metadata } from "next"
import "./globals.css"
import { Bebas_Neue, DM_Mono } from "next/font/google"
import BaseLayout from "@/components/BaseLayout"
import { headers } from "next/headers"

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: "300",
})
const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
})

export async function generateMetadata(): Promise<Metadata> {
  const vercelUrl = process.env.VERCEL_URL
  const headersList = await headers()
  const host = headersList.get("host")

  // Build full domain
  const domain = vercelUrl
    ? `https://${vercelUrl}`
    : host
    ? `http://${host}`
    : "http://localhost:3000"

  return {
    title: "Ghazy Prihanda | Frontend Developer & Side Project Builder",
    description:
      "Welcome to the personal website of Ghazy Timor Prihanda — a frontend developer passionate about building side projects, sharing experiences, and exploring creative ideas.",
    keywords: [
      "Ghazy Prihanda",
      "Frontend Developer",
      "React",
      "Next.js",
      "Side Projects",
      "JavaScript",
      "Personal Website",
    ],
    authors: { name: "Ghazy Prihanda" },
    openGraph: {
      type: "website",
      url: domain,
      title: "Ghazy Prihanda | Frontend Developer & Side Project Builder",
      description:
        "Explore the portfolio, experiences, and side projects of Ghazy Timor Prihanda, a frontend developer passionate about React, Next.js, and creative coding.",
      siteName: "Ghazy Prihanda",
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebasNeue.variable} ${dmMono.variable} antialiased font-body bg-gray-50 text-black`}>
        <BaseLayout>{children}</BaseLayout>
      </body>
    </html>
  )
}
