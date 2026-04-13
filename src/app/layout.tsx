import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
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
  ],
  openGraph: {
    title: "肌肉百科 — 健身初学者知识科普",
    description:
      "通过可交互的人体肌肉示意图，帮助健身初学者快速了解各大肌群的基础知识和训练方法。",
    type: "website",
    locale: "zh_CN",
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
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
