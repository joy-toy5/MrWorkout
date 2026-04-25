import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { buttonVariants } from "@/components/ui/button";
import { ImportBatchUploadForm } from "@/components/admin/import-batch-upload-form";

export default async function ImportBatchesPage() {
  const session = await getAdminSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fimport-batches");
  }

  const batches = await prisma.importBatch.findMany({
    orderBy: {
      startedAt: "desc",
    },
    take: 20,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">内容审核后台</p>
          <h1 className="text-2xl font-bold tracking-tight">导入批次</h1>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-2">
            <Link
              href="/admin/tutorial-candidates"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              候选列表
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            当前管理员：{session.user.email}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <ImportBatchUploadForm defaultPlatform="BILIBILI" />

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">最近批次</h2>
            <span className="text-sm text-muted-foreground">
              共 {batches.length} 个
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-4 font-medium">批次</th>
                  <th className="pb-2 pr-4 font-medium">平台</th>
                  <th className="pb-2 pr-4 font-medium">状态</th>
                  <th className="pb-2 pr-4 font-medium">导入结果</th>
                  <th className="pb-2 pr-4 font-medium">来源</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-t align-top">
                    <td className="py-3 pr-4">
                      <div className="font-mono text-xs">{batch.id}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {batch.startedAt.toLocaleString("zh-CN")}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{batch.platform}</td>
                    <td className="py-3 pr-4">{batch.status}</td>
                    <td className="py-3 pr-4 text-xs leading-5">
                      总计 {batch.totalCount}
                      <br />
                      新增 {batch.importedCount} / 跳过 {batch.skippedCount}
                      <br />
                      失败 {batch.failedCount}
                    </td>
                    <td className="py-3 pr-4 text-xs leading-5 text-muted-foreground">
                      <div>{batch.filePath || "未记录文件名"}</div>
                      {batch.note && <div className="mt-1">{batch.note}</div>}
                      <div className="mt-2">
                        <Link
                          href={`/admin/tutorial-candidates?importBatchId=${batch.id}`}
                          className="text-primary underline underline-offset-4"
                        >
                          查看该批候选
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
