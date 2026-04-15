import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录",
  description: "登录肌肉百科，收藏感兴趣的健身训练教程，打造个人训练知识库。",
  openGraph: {
    title: "登录 | 肌肉百科",
    description: "登录肌肉百科，收藏感兴趣的健身训练教程，打造个人训练知识库。",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
