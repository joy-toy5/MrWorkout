import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "个人中心",
};

export default function ProfilePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">个人中心</h1>
        <p className="mt-2 text-muted-foreground">
          个人中心页面将在阶段八实现
        </p>
      </div>
    </div>
  );
}
