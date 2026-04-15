"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Heart,
  Loader2,
  Play,
  Trash2,
  Mail,
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import musclesData from "@/data/muscles.json";

interface TutorialCard {
  id: string;
  muscleGroupId: string;
  title: string;
  coverImage: string;
  sourceUrl: string;
  platform: "XIAOHONGSHU" | "BILIBILI";
  contentType: "IMAGE_TEXT" | "VIDEO";
}

interface FavoriteRecord {
  id: string;
  tutorialCardId: string;
  muscleGroupId: string;
  createdAt: string;
  tutorialCard: TutorialCard;
}

/** 肌群分类标签配置 */
const CATEGORY_TABS = [
  { value: "all", label: "全部" },
  { value: "胸部", label: "胸部" },
  { value: "背部", label: "背部" },
  { value: "肩部", label: "肩部" },
  { value: "手臂", label: "手臂" },
  { value: "核心", label: "核心" },
  { value: "臀部", label: "臀部" },
  { value: "大腿", label: "大腿" },
  { value: "小腿", label: "小腿" },
  { value: "颈部", label: "颈部" },
] as const;

/** 根据 muscleGroupId 查找肌群所属分类 */
function getMuscleCategory(muscleGroupId: string): string {
  const muscle = (musclesData as { id: string; category: string }[]).find(
    (m) => m.id === muscleGroupId
  );
  return muscle?.category ?? "其他";
}

/** 根据 muscleGroupId 查找肌群中文名 */
function getMuscleNameZh(muscleGroupId: string): string {
  const muscle = (musclesData as { id: string; nameZh: string }[]).find(
    (m) => m.id === muscleGroupId
  );
  return muscle?.nameZh ?? muscleGroupId;
}

/** 平台图标和标签 */
function PlatformBadge({
  platform,
}: {
  platform: TutorialCard["platform"];
}) {
  if (platform === "BILIBILI") {
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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // 取消收藏确认弹窗状态
  const [confirmTarget, setConfirmTarget] = useState<FavoriteRecord | null>(
    null
  );
  const [removing, setRemoving] = useState(false);

  // 未登录时重定向到登录页
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 获取收藏列表
  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) return;
        const data: FavoriteRecord[] = await res.json();
        if (cancelled) return;
        setFavorites(data);
      } catch {
        // 静默失败
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFavorites();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // 取消收藏
  const handleRemoveFavorite = useCallback(async () => {
    if (!confirmTarget) return;

    setRemoving(true);
    try {
      const res = await fetch(`/api/favorites/${confirmTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFavorites((prev) =>
          prev.filter((f) => f.id !== confirmTarget.id)
        );
      }
    } catch {
      // 静默失败
    } finally {
      setRemoving(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget]);

  // 按分类筛选收藏
  const filteredFavorites =
    activeTab === "all"
      ? favorites
      : favorites.filter(
          (f) => getMuscleCategory(f.muscleGroupId) === activeTab
        );

  // 加载中或未认证时显示加载状态
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userName = session?.user?.name ?? "用户";
  const userEmail = session?.user?.email ?? "";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
      {/* 用户信息区 */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="size-16 sm:size-20">
          <AvatarFallback className="text-xl sm:text-2xl">
            {userName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
            {userName}
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate">{userEmail}</span>
          </div>
        </div>
      </div>

      {/* 收藏夹区域 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Heart className="size-5 text-red-500" fill="currentColor" />
          <h2 className="text-lg font-semibold">我的收藏</h2>
          <span className="text-sm text-muted-foreground">
            ({favorites.length})
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : favorites.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="size-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">暂无收藏</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              去首页探索肌群知识，收藏感兴趣的训练教程吧
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/")}
            >
              去首页探索
            </Button>
          </div>
        ) : (
          /* 分组标签 + 卡片网格 */
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="flex-wrap h-auto gap-1">
              {CATEGORY_TABS.map((tab) => {
                // 计算每个分类下的收藏数量
                const count =
                  tab.value === "all"
                    ? favorites.length
                    : favorites.filter(
                        (f) =>
                          getMuscleCategory(f.muscleGroupId) === tab.value
                      ).length;
                // 隐藏没有收藏的分类（"全部"始终显示）
                if (count === 0 && tab.value !== "all") return null;
                return (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                    <span className="ml-1 text-xs opacity-60">{count}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* 所有标签共用一个内容区 — 通过 filteredFavorites 筛选 */}
            {CATEGORY_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {filteredFavorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                      该分类下暂无收藏
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {filteredFavorites.map((fav) => (
                      <FavoriteCard
                        key={fav.id}
                        favorite={fav}
                        onRemove={() => setConfirmTarget(fav)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </section>

      {/* 取消收藏确认弹窗 */}
      <ConfirmRemoveDialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
        title={confirmTarget?.tutorialCard.title ?? ""}
        loading={removing}
        onConfirm={handleRemoveFavorite}
      />
    </div>
  );
}

/** 单张收藏卡片 */
function FavoriteCard({
  favorite,
  onRemove,
}: {
  favorite: FavoriteRecord;
  onRemove: () => void;
}) {
  const card = favorite.tutorialCard;
  const muscleName = getMuscleNameZh(favorite.muscleGroupId);

  return (
    <a
      href={card.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-md"
    >
      {/* 封面图 */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {card.coverImage?.startsWith("http") ? (
          <Image
            src={card.coverImage}
            alt={card.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/40">
            {card.contentType === "VIDEO" ? (
              <Play className="size-10" />
            ) : (
              <BookOpen className="size-10" />
            )}
          </div>
        )}

        {/* 取消收藏按钮 */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 flex items-center justify-center size-7 rounded-full bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-destructive hover:text-white"
          aria-label="取消收藏"
        >
          <Trash2 className="size-3.5" />
        </button>

        {/* 肌群标签 */}
        <div className="absolute bottom-2 left-2">
          <span className="inline-flex items-center rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur">
            {muscleName}
          </span>
        </div>
      </div>

      {/* 卡片信息 */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {card.title}
        </h3>
        <PlatformBadge platform={card.platform} />
      </div>
    </a>
  );
}

/** 取消收藏确认弹窗 */
function ConfirmRemoveDialog({
  open,
  onOpenChange,
  title,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  loading: boolean;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>确定取消收藏？</DialogTitle>
          <DialogDescription>
            将从收藏夹中移除「{title}」
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            确认移除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
