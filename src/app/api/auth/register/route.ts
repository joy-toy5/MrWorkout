import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerApiSchema } from "@/lib/validations";
import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  normalizeEmail,
} from "@/lib/email-verification";
import { sendRegistrationVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 注册接口：每个 IP 每 15 分钟最多 5 次请求
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW = 15 * 60 * 1000;
const REGISTER_EMAIL_LIMIT = 3;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Zod 验证
    const result = registerApiSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "输入验证失败", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const email = normalizeEmail(result.data.email);
    const { nickname, password } = result.data;

    // 速率限制
    const ip = getClientIp(request);
    const ipLimit = rateLimit(`register:ip:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW);
    const emailLimit = rateLimit(
      `register:email:${email}`,
      REGISTER_EMAIL_LIMIT,
      REGISTER_WINDOW
    );

    if (ipLimit.limited || emailLimit.limited) {
      return NextResponse.json(
        { error: "请求过于频繁，请 15 分钟后再试" },
        {
          status: 429,
          headers: { "Retry-After": "900", "X-RateLimit-Remaining": "0" },
        }
      );
    }

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);
    const { token, tokenHash, expiresAt } = createEmailVerificationToken();

    await prisma.pendingRegistration.upsert({
      where: { email },
      update: {
        nickname,
        passwordHash: hashedPassword,
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: expiresAt,
        lastSentAt: new Date(),
      },
      create: {
        email,
        nickname,
        passwordHash: hashedPassword,
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: expiresAt,
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
      {
        email,
        message: "验证邮件已发送，请先完成邮箱验证再登录",
      },
      { status: 202 }
    );
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
