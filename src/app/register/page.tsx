"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      nickname: formData.get("nickname") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    // 前端 Zod 验证
    const result = registerSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          nickname: data.nickname,
          password: data.password,
        }),
      });

      if (res.status === 409) {
        setError("该邮箱已被注册");
        return;
      }

      if (!res.ok) {
        const body = await res.json();
        if (body.details) {
          setFieldErrors(body.details);
        } else {
          setError(body.error || "注册失败，请稍后重试");
        }
        return;
      }

      // 注册成功，跳转登录页
      router.push("/login?registered=true");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">创建账号</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            注册后可收藏感兴趣的训练教程
          </p>
        </div>

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
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
            )}
          </div>

          {/* 昵称 */}
          <div className="space-y-1.5">
            <Label htmlFor="nickname">昵称</Label>
            <Input
              id="nickname"
              name="nickname"
              type="text"
              placeholder="2-20 个字符"
              autoComplete="username"
              aria-invalid={!!fieldErrors.nickname}
            />
            {fieldErrors.nickname && (
              <p className="text-xs text-destructive">
                {fieldErrors.nickname[0]}
              </p>
            )}
          </div>

          {/* 密码 */}
          <div className="space-y-1.5">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="至少 8 位，含字母和数字"
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && (
              <p className="text-xs text-destructive">
                {fieldErrors.password[0]}
              </p>
            )}
          </div>

          {/* 确认密码 */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.confirmPassword}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive">
                {fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>

          {/* 全局错误 */}
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            注册
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
