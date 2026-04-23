import { BookOpen, Play } from "lucide-react";

/**
 * 平台徽章组件 — 统一处理 B站 / 小红书标识
 * 兼容静态数据（小写 "bilibili"）和数据库数据（大写 "BILIBILI"）
 */
export function PlatformBadge({
  platform,
}: {
  platform: string;
}) {
  const normalized = platform.toLowerCase();

  if (normalized === "bilibili") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#00a1d6]/10 px-2 py-0.5 text-xs font-medium text-[#00a1d6]">
        <Play className="size-3" />
        B站
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fe2c55]/10 px-2 py-0.5 text-xs font-medium text-[#fe2c55]">
      <BookOpen className="size-3" />
      小红书
    </span>
  );
}
