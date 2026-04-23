import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailOnlySchema } from "@/lib/validations";
import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  normalizeEmail,
} from "@/lib/email-verification";
import { sendRegistrationVerificationEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const RESEND_LIMIT = 5;
const RESEND_EMAIL_LIMIT = 3;
const RESEND_WINDOW = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = emailOnlySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "输入验证失败", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const email = normalizeEmail(result.data.email);
    const ip = getClientIp(request);
    const ipLimit = rateLimit(`resend:ip:${ip}`, RESEND_LIMIT, RESEND_WINDOW);
    const emailLimit = rateLimit(
      `resend:email:${email}`,
      RESEND_EMAIL_LIMIT,
      RESEND_WINDOW
    );

    if (ipLimit.limited || emailLimit.limited) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email },
    });

    if (!pending) {
      return NextResponse.json(
        { message: "如果该邮箱存在待验证注册，验证邮件已重新发送" },
        { status: 200 }
      );
    }

    const { token, tokenHash, expiresAt } = createEmailVerificationToken();

    await prisma.pendingRegistration.update({
      where: { email },
      data: {
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: expiresAt,
        lastSentAt: new Date(),
      },
    });

    const verificationUrl = buildEmailVerificationUrl(
      new URL(request.url).origin,
      token,
      email
    );

    await sendRegistrationVerificationEmail({
      to: email,
      verificationUrl,
    });

    return NextResponse.json(
      { message: "如果该邮箱存在待验证注册，验证邮件已重新发送" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
