import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { normalizeRemoteAssetUrl } from "@/lib/media-url";
import musclesData from "@/data/muscles.json";
import { PlatformBadge } from "@/components/platform-badge";
import { TutorialCandidateReviewForm } from "@/components/admin/tutorial-candidate-review-form";

export default async function TutorialCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Ftutorial-candidates");
  }

  const { id } = await params;
  const candidate = await prisma.externalTutorialCandidate.findUnique({
    where: { id },
    include: {
      importBatch: true,
      reviewedBy: true,
      publishedCard: true,
    },
  });

  if (!candidate) {
    notFound();
  }

  const muscleOptions = (musclesData as Array<{
    id: string;
    nameZh: string;
    category: string;
  }>).sort((left, right) => left.category.localeCompare(right.category, "zh-CN"));
  const coverImage = normalizeRemoteAssetUrl(candidate.coverImage);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/tutorial-candidates"
            className="text-sm text-primary underline underline-offset-4"
          >
            返回候选列表
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            候选内容详情
          </h1>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>状态：{candidate.ingestStatus}</div>
          <div>平台：{candidate.platform}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <PlatformBadge
                platform={
                  candidate.platform === "BILIBILI" ? "bilibili" : "xiaohongshu"
                }
              />
              <span className="text-sm text-muted-foreground">
                来源 ID：{candidate.sourceId}
              </span>
            </div>

            <h2 className="mt-4 text-xl font-semibold">{candidate.title}</h2>

            {coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt={candidate.title}
                className="mt-4 aspect-video w-full rounded-xl border object-cover"
              />
            )}

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">作者</dt>
                <dd>{candidate.creatorName || "未知作者"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">肌群</dt>
                <dd>{candidate.muscleGroupId || "未匹配"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">发布时间</dt>
                <dd>
                  {candidate.publishedAt
                    ? candidate.publishedAt.toLocaleString("zh-CN")
                    : "未知"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">导入批次</dt>
                <dd className="font-mono text-xs">{candidate.importBatchId}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <a
                href={candidate.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                打开原始链接
              </a>
            </div>

            {candidate.summary && (
              <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm leading-relaxed">
                {candidate.summary}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">审核轨迹</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">审核人</dt>
                <dd>
                  {candidate.reviewedBy?.nickname ||
                    candidate.reviewedBy?.email ||
                    "暂无"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">审核时间</dt>
                <dd>
                  {candidate.reviewedAt
                    ? candidate.reviewedAt.toLocaleString("zh-CN")
                    : "暂无"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">审核备注</dt>
                <dd>{candidate.reviewNote || "暂无"}</dd>
              </div>
              {candidate.publishedCard && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">正式教程卡片</dt>
                  <dd className="font-mono text-xs">{candidate.publishedCard.id}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">原始 Payload</h2>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-muted/40 p-4 text-xs leading-6">
              {JSON.stringify(JSON.parse(candidate.rawPayload), null, 2)}
            </pre>
          </section>
        </div>

        <div className="min-w-0">
          <TutorialCandidateReviewForm
            candidate={{
              id: candidate.id,
              title: candidate.title,
              coverImage,
              creatorName: candidate.creatorName,
              sourceUrl: candidate.sourceUrl,
              muscleGroupId: candidate.muscleGroupId,
              reviewNote: candidate.reviewNote,
            }}
            muscleOptions={muscleOptions}
          />
        </div>
      </div>
    </div>
  );
}
