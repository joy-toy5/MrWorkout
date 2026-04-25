"use client";

import type { FormEvent } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const PLATFORM_OPTIONS = [
  { value: "BILIBILI", label: "B站" },
  { value: "XIAOHONGSHU", label: "小红书" },
] as const;

interface ImportBatchUploadFormProps {
  defaultPlatform?: (typeof PLATFORM_OPTIONS)[number]["value"];
}

export function ImportBatchUploadForm({
  defaultPlatform = "BILIBILI",
}: ImportBatchUploadFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [platform, setPlatform] = useState<string>(defaultPlatform);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    batchId: string;
    totalCount: number;
    importedCount: number;
    skippedCount: number;
    failedCount: number;
  } | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/import-batches", {
          method: "POST",
          body: formData,
        });

        const body = await response.json();

        if (!response.ok) {
          setError(body.error || "导入失败，请稍后重试");
          return;
        }

        setSuccess({
          batchId: body.batchId,
          totalCount: body.totalCount,
          importedCount: body.importedCount,
          skippedCount: body.skippedCount,
          failedCount: body.failedCount,
        });
        formRef.current?.reset();
        setPlatform(defaultPlatform);
        router.refresh();
      } catch {
        setError("网络错误，请稍后重试");
      }
    });
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Upload className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">上传 JSONL 导入</h2>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-4 space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="platform">平台</Label>
          <select
            id="platform"
            name="platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
            disabled={isPending}
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="file">JSONL 文件</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".jsonl,text/plain,application/x-ndjson"
            required
            disabled={isPending}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note">备注</Label>
          <textarea
            id="note"
            name="note"
            rows={3}
            disabled={isPending}
            placeholder="例如：2026-04 小红书臀部训练二次补采"
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
            导入完成：批次 {success.batchId}，总计 {success.totalCount} 条，新增{" "}
            {success.importedCount} 条，跳过 {success.skippedCount} 条，失败{" "}
            {success.failedCount} 条。
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            开始导入
          </Button>
        </div>
      </form>
    </div>
  );
}
