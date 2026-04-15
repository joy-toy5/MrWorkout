import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "个人中心",
  description: "管理你的肌肉百科收藏夹，按肌群分类查看已收藏的健身训练教程。",
  openGraph: {
    title: "个人中心 | 肌肉百科",
    description: "管理你的肌肉百科收藏夹，按肌群分类查看已收藏的健身训练教程。",
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
