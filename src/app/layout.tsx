import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Tracker - Health & Habit Tracker",
  description: "A comprehensive mobile-first health and habit tracker to monitor your water intake, calories, habits, sleep, and overall wellness.",
  keywords: ["health tracker", "habit tracker", "water tracker", "calorie counter", "sleep tracker", "daily wellness"],
  authors: [{ name: "Daily Tracker" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Daily Tracker",
    description: "Track your daily health and habits with style",
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
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: '#0a0a0f', color: '#ffffff' }}
      >
        {children}
      </body>
    </html>
  );
}
