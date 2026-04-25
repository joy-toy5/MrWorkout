"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TutorialCandidateReviewFormProps {
  candidate: {
    id: string;
    title: string;
    coverImage: string | null;
    creatorName: string | null;
    sourceUrl: string;
    muscleGroupId: string | null;
    reviewNote: string | null;
  };
  muscleOptions: Array<{
    id: string;
    nameZh: string;
    category: string;
  }>;
}

export function TutorialCandidateReviewForm({
  candidate,
  muscleOptions,
}: TutorialCandidateReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(candidate.title);
  const [coverImage, setCoverImage] = useState(candidate.coverImage ?? "");
  const [creatorName, setCreatorName] = useState(candidate.creatorName ?? "");
  const [muscleGroupId, setMuscleGroupId] = useState(candidate.muscleGroupId ?? "");
  const [reviewNote, setReviewNote] = useState(candidate.reviewNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submitReview = (action: "publish" | "reject") => {
    if (action === "publish" && !muscleGroupId) {
      setError("发布前必须选择肌群");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/tutorial-candidates/${candidate.id}/review`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action,
              title: title.trim(),
              coverImage: coverImage.trim(),
              creatorName: creatorName.trim(),
              muscleGroupId: muscleGroupId || null,
              reviewNote: reviewNote.trim(),
            }),
          }
        );

        const body = await response.json();

        if (!response.ok) {
          setError(body.error || "操作失败，请稍后重试");
          return;
        }

        setSuccess(action === "publish" ? "已发布为正式教程卡片" : "已拒绝该候选内容");
        router.refresh();
      } catch {
        setError("网络错误，请稍后重试");
      }
    });
  };

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="candidate-title">标题</Label>
          <Input
            id="candidate-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="candidate-cover">封面</Label>
          <Input
            id="candidate-cover"
            value={coverImage}
            onChange={(event) => setCoverImage(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="candidate-creator">作者</Label>
          <Input
            id="candidate-creator"
            value={creatorName}
            onChange={(event) => setCreatorName(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="candidate-url">来源链接</Label>
          <Input id="candidate-url" value={candidate.sourceUrl} readOnly />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="candidate-muscle">肌群</Label>
          <select
            id="candidate-muscle"
            value={muscleGroupId}
            onChange={(event) => setMuscleGroupId(event.target.value)}
            className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
          >
            <option value="">请选择肌群</option>
            {muscleOptions.map((muscle) => (
              <option key={muscle.id} value={muscle.id}>
                {muscle.category} / {muscle.nameZh}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="candidate-note">审核备注</Label>
          <textarea
            id="candidate-note"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            rows={4}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
            placeholder="记录拒绝原因、标题修改依据或发布说明"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => submitReview("publish")}
          disabled={isPending}
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          通过并发布
        </Button>
        <Button
          variant="destructive"
          onClick={() => submitReview("reject")}
          disabled={isPending}
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          拒绝
        </Button>
      </div>
    </div>
  );
}
