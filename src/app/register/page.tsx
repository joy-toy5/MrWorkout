import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "注册",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">注册</h1>
        <p className="mt-2 text-muted-foreground">
          注册表单将在阶段六实现
        </p>
      </div>
    </div>
  );
}
