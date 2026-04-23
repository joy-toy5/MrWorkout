import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/navbar";
import { SessionProvider } from "@/components/session-provider";
import { FavoritesProvider } from "@/components/favorites-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "肌肉百科 — 健身初学者知识科普",
    template: "%s | 肌肉百科",
  },
  description:
    "通过可交互的人体肌肉示意图，帮助健身初学者快速了解各大肌群的基础知识和训练方法，聚合小红书、B站等平台的优质健身教程内容。",
  keywords: [
    "健身",
    "肌肉",
    "训练",
    "肌群",
    "健身入门",
    "肌肉百科",
    "健身教程",
    "人体肌肉图",
    "肌肉解剖",
    "训练动作",
    "健身知识",
  ],
  openGraph: {
    title: "肌肉百科 — 健身初学者知识科普",
    description:
      "通过可交互的人体肌肉示意图，帮助健身初学者快速了解各大肌群的基础知识和训练方法。",
    type: "website",
    locale: "zh_CN",
    siteName: "肌肉百科",
  },
  twitter: {
    card: "summary_large_image",
    title: "肌肉百科 — 健身初学者知识科普",
    description:
      "通过可交互的人体肌肉示意图，帮助健身初学者快速了解各大肌群的基础知识和训练方法。",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SessionProvider>
            <FavoritesProvider>
              <Navbar />
              <main className="flex-1">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
              <Toaster />
            </FavoritesProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
