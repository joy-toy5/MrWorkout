import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "验证邮箱",
  description: "完成邮箱验证后即可登录肌肉百科并使用收藏功能。",
  openGraph: {
    title: "验证邮箱 | 肌肉百科",
    description: "完成邮箱验证后即可登录肌肉百科并使用收藏功能。",
  },
};

export default function VerifyEmailLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
