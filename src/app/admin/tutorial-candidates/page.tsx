import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { Button, buttonVariants } from "@/components/ui/button";
import musclesData from "@/data/muscles.json";

type SearchParams = Promise<{
  platform?: string;
  status?: string;
  muscleGroupId?: string;
  importBatchId?: string;
  q?: string;
}>;

const STATUS_OPTIONS = [
  "NEW",
  "FILTERED",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
] as const;

export default async function TutorialCandidatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getAdminSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Ftutorial-candidates");
  }

  const params = await searchParams;
  const q = params.q?.trim() || "";
  const muscleOptions = (musclesData as Array<{
    id: string;
    nameZh: string;
    category: string;
  }>).sort((left, right) => left.category.localeCompare(right.category, "zh-CN"));
  const where = {
    ...(params.platform ? { platform: params.platform } : {}),
    ...(params.status ? { ingestStatus: params.status } : {}),
    ...(params.muscleGroupId ? { muscleGroupId: params.muscleGroupId } : {}),
    ...(params.importBatchId ? { importBatchId: params.importBatchId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { creatorName: { contains: q } },
            { sourceId: { contains: q } },
          ],
        }
      : {}),
  };

  const [candidates, batches] = await Promise.all([
    prisma.externalTutorialCandidate.findMany({
      where,
      include: {
        importBatch: true,
        reviewedBy: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        publishedCard: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),
    prisma.importBatch.findMany({
      orderBy: {
        startedAt: "desc",
      },
      take: 8,
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">内容审核后台</p>
          <h1 className="text-2xl font-bold tracking-tight">候选教程列表</h1>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-2">
            <Link
              href="/admin/import-batches"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              导入批次
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            当前管理员：{session.user.email}
          </div>
        </div>
      </div>

      <form className="mt-6 grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-5">
        <input
          type="text"
          name="q"
          placeholder="搜索标题 / 作者 / 来源 ID"
          defaultValue={q}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none md:col-span-2"
        />
        <select
          name="platform"
          defaultValue={params.platform ?? ""}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
        >
          <option value="">全部平台</option>
          <option value="BILIBILI">B站</option>
          <option value="XIAOHONGSHU">小红书</option>
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
        >
          <option value="">全部状态</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          name="muscleGroupId"
          defaultValue={params.muscleGroupId ?? ""}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
        >
          <option value="">全部肌群</option>
          {muscleOptions.map((muscle) => (
            <option key={muscle.id} value={muscle.id}>
              {muscle.category} / {muscle.nameZh}
            </option>
          ))}
        </select>
        <div className="md:col-span-5 flex justify-end">
          <Button type="submit" variant="outline">
            应用筛选
          </Button>
        </div>
      </form>

      <section className="mt-6 rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近导入批次</h2>
          <span className="text-sm text-muted-foreground">
            共 {batches.length} 个批次
          </span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4 font-medium">批次</th>
                <th className="pb-2 pr-4 font-medium">平台</th>
                <th className="pb-2 pr-4 font-medium">状态</th>
                <th className="pb-2 pr-4 font-medium">总数</th>
                <th className="pb-2 pr-4 font-medium">导入</th>
                <th className="pb-2 pr-4 font-medium">跳过</th>
                <th className="pb-2 pr-4 font-medium">失败</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} className="border-t">
                  <td className="py-2 pr-4 font-mono text-xs">
                    <Link
                      href={`/admin/tutorial-candidates?importBatchId=${batch.id}`}
                      className="underline underline-offset-4"
                    >
                      {batch.id}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{batch.platform}</td>
                  <td className="py-2 pr-4">{batch.status}</td>
                  <td className="py-2 pr-4">{batch.totalCount}</td>
                  <td className="py-2 pr-4">{batch.importedCount}</td>
                  <td className="py-2 pr-4">{batch.skippedCount}</td>
                  <td className="py-2 pr-4">{batch.failedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">候选内容</h2>
          <span className="text-sm text-muted-foreground">
            当前结果 {candidates.length} 条
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4 font-medium">标题</th>
                <th className="pb-2 pr-4 font-medium">平台</th>
                <th className="pb-2 pr-4 font-medium">肌群</th>
                <th className="pb-2 pr-4 font-medium">状态</th>
                <th className="pb-2 pr-4 font-medium">批次</th>
                <th className="pb-2 pr-4 font-medium">来源 ID</th>
                <th className="pb-2 pr-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="border-t align-top">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{candidate.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {candidate.creatorName || "未知作者"}
                    </div>
                  </td>
                  <td className="py-3 pr-4">{candidate.platform}</td>
                  <td className="py-3 pr-4">{candidate.muscleGroupId || "未匹配"}</td>
                  <td className="py-3 pr-4">
                    {candidate.ingestStatus}
                    {candidate.publishedCard && (
                      <div className="mt-1 text-xs text-green-600">
                        已发布
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-mono text-xs">{candidate.importBatch.id}</div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{candidate.sourceId}</td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/tutorial-candidates/${candidate.id}`}
                      className="text-primary underline underline-offset-4"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
