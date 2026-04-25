import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRemoteAssetUrl } from "@/lib/media-url";

const DEFAULT_LIMIT = 8;

function normalizeLimit(raw: string | null) {
  if (!raw) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, DEFAULT_LIMIT);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const muscleGroupId = searchParams.get("muscleGroupId")?.trim();
    const limit = normalizeLimit(searchParams.get("limit"));

    if (!muscleGroupId) {
      return NextResponse.json(
        { error: "缺少 muscleGroupId 查询参数" },
        { status: 400 }
      );
    }

    const tutorialCards = await prisma.tutorialCard.findMany({
      where: {
        muscleGroupId,
      },
      orderBy: [
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    return NextResponse.json(
      tutorialCards.map((card) => ({
        id: card.id,
        muscleGroupId: card.muscleGroupId,
        title: card.title,
        coverImage: normalizeRemoteAssetUrl(card.coverImage),
        sourceUrl: card.sourceUrl,
        platform: card.platform.toLowerCase(),
        contentType: card.contentType.toLowerCase(),
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
