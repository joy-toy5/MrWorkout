import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { normalizeRemoteAssetUrl } from "@/lib/media-url";

interface ReviewRequestBody {
  action?: "publish" | "reject";
  title?: string;
  coverImage?: string;
  creatorName?: string;
  muscleGroupId?: string | null;
  reviewNote?: string;
}

function normalizeOptionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();

    const reviewerId = session?.user?.id;

    if (!reviewerId) {
      return NextResponse.json({ error: "无权访问审核后台" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as ReviewRequestBody;
    const action = body.action;

    if (action !== "publish" && action !== "reject") {
      return NextResponse.json({ error: "无效的审核动作" }, { status: 400 });
    }

    const candidate = await prisma.externalTutorialCandidate.findUnique({
      where: { id },
      include: {
        publishedCard: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "候选内容不存在" }, { status: 404 });
    }

    const title = body.title?.trim();
    const coverImage = normalizeRemoteAssetUrl(body.coverImage);

    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }

    if (action === "publish" && !body.muscleGroupId) {
      return NextResponse.json({ error: "发布前必须选择肌群" }, { status: 400 });
    }

    const reviewNote = normalizeOptionalString(body.reviewNote);
    const creatorName = normalizeOptionalString(body.creatorName);

    if (action === "reject") {
      const updated = await prisma.externalTutorialCandidate.update({
        where: { id },
        data: {
          title,
          coverImage: coverImage || null,
          creatorName,
          muscleGroupId: body.muscleGroupId || null,
          reviewNote,
          ingestStatus: "REJECTED",
          reviewedAt: new Date(),
          reviewedByUserId: reviewerId,
        },
      });

      return NextResponse.json({
        success: true,
        candidate: updated,
      });
    }

    const publishedCard = await prisma.$transaction(async (tx) => {
      const tutorialData = {
        muscleGroupId: body.muscleGroupId!,
        title,
        coverImage:
          coverImage || normalizeRemoteAssetUrl(candidate.coverImage) || "",
        sourceUrl: candidate.sourceUrl,
        platform: candidate.platform,
        contentType: candidate.contentType,
        sourceId: candidate.sourceId,
        creatorName,
        publishedAt: candidate.publishedAt,
        importBatchId: candidate.importBatchId,
        candidateId: candidate.id,
      };

      const existingCard =
        candidate.publishedCard ||
        (await tx.tutorialCard.findFirst({
          where: {
            platform: candidate.platform,
            sourceId: candidate.sourceId,
          },
          orderBy: {
            createdAt: "desc",
          },
        }));

      const card = existingCard
        ? await tx.tutorialCard.update({
            where: { id: existingCard.id },
            data: tutorialData,
          })
        : await tx.tutorialCard.create({
            data: tutorialData,
          });

      await tx.externalTutorialCandidate.update({
        where: { id: candidate.id },
        data: {
          title,
          coverImage: tutorialData.coverImage,
          creatorName,
          muscleGroupId: tutorialData.muscleGroupId,
          reviewNote,
          ingestStatus: "PUBLISHED",
          reviewedAt: new Date(),
          reviewedByUserId: reviewerId,
        },
      });

      return card;
    });

    return NextResponse.json({
      success: true,
      tutorialCard: publishedCard,
    });
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
