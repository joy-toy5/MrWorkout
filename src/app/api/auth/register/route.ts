import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerApiSchema } from "@/lib/validations";

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

    const { email, nickname, password } = result.data;

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

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        nickname,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, nickname: user.nickname },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
