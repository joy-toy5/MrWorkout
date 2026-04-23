"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validations";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "true";
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const prefilledEmail = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // 前端 Zod 验证
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        if (res.code === "email_not_verified") {
          setVerificationEmail(data.email.trim().toLowerCase());
          setError("该邮箱尚未完成验证，请先查收验证邮件。");
          return;
        }

        setError("邮箱或密码错误");
        return;
      }

      // 登录成功，跳转回调页或首页
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">登录</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          登录后可收藏感兴趣的训练教程
        </p>
      </div>

      {justVerified && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
          邮箱验证成功，现在可以登录了。
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 邮箱 */}
        <div className="space-y-1.5">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            autoComplete="email"
            aria-invalid={!!fieldErrors.email}
            defaultValue={prefilledEmail}
          />
          {fieldErrors.email && (
            <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* 密码 */}
        <div className="space-y-1.5">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="输入密码"
            autoComplete="current-password"
            aria-invalid={!!fieldErrors.password}
          />
          {fieldErrors.password && (
            <p className="text-xs text-destructive">
              {fieldErrors.password[0]}
            </p>
          )}
        </div>

        {/* 全局错误 */}
        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <p>{error}</p>
            {verificationEmail && (
              <Link
                href={`/verify-email?email=${encodeURIComponent(verificationEmail)}`}
                className="mt-2 inline-block font-medium underline underline-offset-4"
              >
                前往邮箱验证页
              </Link>
            )}
          </div>
        )}

        {/* 提交按钮 */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          登录
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        还没有账号？{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          去注册
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
