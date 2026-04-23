import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validations";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { hashEmailVerificationToken } from "@/lib/email-verification";

const VERIFY_LIMIT = 20;
const VERIFY_WINDOW = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const verifyLimit = rateLimit(`verify-email:${ip}`, VERIFY_LIMIT, VERIFY_WINDOW);

    if (verifyLimit.limited) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const body = await request.json();
    const result = verifyEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "验证链接无效" },
        { status: 400 }
      );
    }

    const tokenHash = hashEmailVerificationToken(result.data.token);
    const pending = await prisma.pendingRegistration.findUnique({
      where: { verificationTokenHash: tokenHash },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "验证链接无效或已使用", code: "invalid_token" },
        { status: 400 }
      );
    }

    if (pending.verificationTokenExpiresAt <= new Date()) {
      return NextResponse.json(
        {
          error: "验证链接已过期，请重新发送验证邮件",
          code: "expired_token",
          email: pending.email,
        },
        { status: 400 }
      );
    }

    const verifiedAt = new Date();

    await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: pending.email },
      });

      if (existingUser) {
        if (!existingUser.emailVerifiedAt) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { emailVerifiedAt: verifiedAt },
          });
        }
      } else {
        await tx.user.create({
          data: {
            email: pending.email,
            nickname: pending.nickname,
            password: pending.passwordHash,
            emailVerifiedAt: verifiedAt,
          },
        });
      }

      await tx.pendingRegistration.delete({
        where: { id: pending.id },
      });
    });

    return NextResponse.json(
      { message: "邮箱验证成功", email: pending.email },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
