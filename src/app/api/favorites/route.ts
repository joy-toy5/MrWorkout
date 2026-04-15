import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addFavoriteSchema } from "@/lib/validations";

/** POST /api/favorites — 添加收藏 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();

    // Zod 验证
    const result = addFavoriteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "输入验证失败", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { tutorialCardId, muscleGroupId } = result.data;

    // 检查教程卡片是否存在
    const tutorialCard = await prisma.tutorialCard.findUnique({
      where: { id: tutorialCardId },
    });
    if (!tutorialCard) {
      return NextResponse.json(
        { error: "教程卡片不存在" },
        { status: 404 }
      );
    }

    // 检查是否已收藏（联合唯一约束）
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_tutorialCardId: {
          userId: session.user.id,
          tutorialCardId,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "已收藏该教程" },
        { status: 409 }
      );
    }

    // 写入 Favorite 表
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        tutorialCardId,
        muscleGroupId,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

/** GET /api/favorites — 获取当前用户的收藏列表 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const muscleGroupId = searchParams.get("muscleGroupId");

    const where: { userId: string; muscleGroupId?: string } = {
      userId: session.user.id,
    };
    if (muscleGroupId) {
      where.muscleGroupId = muscleGroupId;
    }

    const favorites = await prisma.favorite.findMany({
      where,
      include: {
        tutorialCard: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(favorites);
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
