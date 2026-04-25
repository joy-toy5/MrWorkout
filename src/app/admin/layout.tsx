import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "内容审核后台",
  description: "审核外部导入的教程候选内容，并发布到 MrWorkout 正式教程卡片。",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
