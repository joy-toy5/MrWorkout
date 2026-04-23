"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";
  const sent = searchParams.get("sent") === "true";
  const hasAttemptedVerification = useRef(false);

  const [verifyLoading, setVerifyLoading] = useState(Boolean(token));
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resolvedEmail, setResolvedEmail] = useState(email);

  useEffect(() => {
    if (!token || hasAttemptedVerification.current) {
      return;
    }

    hasAttemptedVerification.current = true;

    async function verify() {
      setVerifyLoading(true);
      setVerifyError(null);

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const body = await res.json();

        if (!res.ok) {
          setVerifyError(body.error || "验证失败，请重新发送验证邮件");
          if (body.email) {
            setResolvedEmail(body.email);
          }
          return;
        }

        setVerifySuccess(true);
        if (body.email) {
          setResolvedEmail(body.email);
        }
      } catch {
        setVerifyError("网络错误，请稍后重试");
      } finally {
        setVerifyLoading(false);
      }
    }

    void verify();
  }, [token]);

  async function handleResend() {
    if (!resolvedEmail) {
      setResendError("缺少邮箱地址，无法重新发送验证邮件");
      return;
    }

    setResendLoading(true);
    setResendError(null);
    setResendMessage(null);

    try {
      const res = await fetch("/api/auth/register/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resolvedEmail }),
      });
      const body = await res.json();

      if (!res.ok) {
        setResendError(body.error || "重发失败，请稍后重试");
        return;
      }

      setResendMessage(
        body.message || "如果该邮箱存在待验证注册，验证邮件已重新发送"
      );
    } catch {
      setResendError("网络错误，请稍后重试");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">邮箱验证</h1>
          <p className="text-sm text-muted-foreground">
            完成邮箱验证后，账号才会真正创建并允许登录。
          </p>
        </div>

        {verifyLoading && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            正在验证邮箱，请稍候...
          </div>
        )}

        {!token && sent && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
            验证邮件已发送，请检查邮箱并点击邮件中的验证链接。
          </div>
        )}

        {verifySuccess && (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
              邮箱验证成功，现在可以登录了。
            </div>
            <Link
              href={`/login?verified=true${
                resolvedEmail ? `&email=${encodeURIComponent(resolvedEmail)}` : ""
              }`}
              className={buttonVariants({ className: "w-full" })}
            >
              去登录
            </Link>
          </div>
        )}

        {!verifyLoading && !verifySuccess && (
          <div className="space-y-4">
            {resolvedEmail && (
              <div className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                当前邮箱：<span className="font-medium text-foreground">{resolvedEmail}</span>
              </div>
            )}

            {verifyError && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {verifyError}
              </div>
            )}

            {resendMessage && (
              <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
                {resendMessage}
              </div>
            )}

            {resendError && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {resendError}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resendLoading}
              onClick={handleResend}
            >
              {resendLoading && <Loader2 className="size-4 animate-spin" />}
              重新发送验证邮件
            </Button>

            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", className: "w-full" })}
            >
              返回登录
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
