import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ferrix — AI prepares. People place.",
  description:
    "Voice-first livelihood copilot for Nairobi's informal workforce. Hack for Humanity Nairobi 2026: job displacement, technical literacy, accessibility.",
  keywords: ["Ferrix", "Ajira Copilot", "Hack for Humanity", "Nairobi", "AI", "livelihood", "informal economy"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Ferrix — AI prepares. People place.",
    description: "AI prepares the worker. People make the placement.",
    siteName: "Ferrix",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
