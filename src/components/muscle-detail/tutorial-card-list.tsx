"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/components/favorites-provider";
import { PlatformBadge } from "@/components/platform-badge";
import { TutorialCoverImage } from "@/components/tutorial-cover-image";

interface TutorialData {
  id: string;
  muscleGroupId: string;
  title: string;
  coverImage: string;
  sourceUrl: string;
  platform: "bilibili" | "xiaohongshu";
  contentType: "video" | "image_text";
}

interface TutorialCardListProps {
  tutorials: TutorialData[];
  loading?: boolean;
  error?: string | null;
}

export function TutorialCardList({
  tutorials,
  loading = false,
  error = null,
}: TutorialCardListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { status } = useSession();
  const router = useRouter();
  const { favoriteMap, pending, addFavorite, removeFavorite } = useFavorites();

  // ref 跟踪最新 favoriteMap，避免 toggleFavorite 的 useCallback 依赖它而频繁重建
  const favoriteMapRef = useRef(favoriteMap);
  useEffect(() => {
    favoriteMapRef.current = favoriteMap;
  }, [favoriteMap]);

  const toggleFavorite = useCallback(
    async (tutorial: TutorialData) => {
      // 未登录 → 跳转登录页
      if (status !== "authenticated") {
        router.push("/login");
        return;
      }

      const isFavorited = favoriteMapRef.current.has(tutorial.id);

      if (isFavorited) {
        await removeFavorite(tutorial.id);
      } else {
        await addFavorite(tutorial.id, tutorial.muscleGroupId);
      }
    },
    [status, router, addFavorite, removeFavorite]
  );

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <BookOpen className="size-4" />
          相关教程
          <span className="text-xs">({tutorials.length})</span>
        </div>

        {/* 桌面端滚动箭头 */}
        <div className="hidden sm:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => scroll("left")}
            aria-label="向左滚动"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => scroll("right")}
            aria-label="向右滚动"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          正在加载相关教程...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-destructive">
          {error}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          暂无已发布的相关教程
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent min-w-0"
        >
          {tutorials.map((tutorial) => {
            const isFavorited = favoriteMap.has(tutorial.id);
            const isPending = pending.has(tutorial.id);

            return (
              <a
                key={tutorial.id}
                href={tutorial.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-none w-[220px] snap-start rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* 封面图 */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <TutorialCoverImage
                    src={tutorial.coverImage}
                    alt={tutorial.title}
                    contentType={tutorial.contentType}
                    className="h-full w-full"
                  />

                  {/* 收藏按钮 */}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(tutorial);
                    }}
                    className={`absolute top-2 right-2 flex items-center justify-center size-7 rounded-full backdrop-blur transition-colors ${
                      isFavorited
                        ? "bg-red-500/90 text-white hover:bg-red-600"
                        : "bg-background/80 text-muted-foreground hover:text-red-500 hover:bg-background"
                    } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-label={isFavorited ? "取消收藏" : "收藏"}
                  >
                    <Heart
                      className="size-3.5"
                      fill={isFavorited ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                {/* 卡片信息 */}
                <div className="p-2.5 space-y-1.5">
                  <h4 className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {tutorial.title}
                  </h4>
                  <PlatformBadge platform={tutorial.platform} />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
