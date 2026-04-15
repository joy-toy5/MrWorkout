import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "注册",
  description: "注册肌肉百科账号，开始探索人体肌群知识，收藏优质健身教程。",
  openGraph: {
    title: "注册 | 肌肉百科",
    description: "注册肌肉百科账号，开始探索人体肌群知识，收藏优质健身教程。",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
