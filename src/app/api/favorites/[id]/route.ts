import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** DELETE /api/favorites/[id] — 取消收藏 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    // 查找收藏记录并验证归属
    const favorite = await prisma.favorite.findUnique({
      where: { id },
    });

    if (!favorite) {
      return NextResponse.json(
        { error: "收藏记录不存在" },
        { status: 404 }
      );
    }

    if (favorite.userId !== session.user.id) {
      return NextResponse.json(
        { error: "无权操作此收藏" },
        { status: 403 }
      );
    }

    // 删除收藏记录
    await prisma.favorite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
