"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, ChevronLeft, ChevronRight, Heart, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorialData {
  id: string;
  muscleGroupId: string;
  title: string;
  coverImage: string;
  sourceUrl: string;
  platform: "bilibili" | "xiaohongshu";
  contentType: "video" | "image_text";
}

interface FavoriteRecord {
  id: string;
  tutorialCardId: string;
}

interface TutorialCardListProps {
  tutorials: TutorialData[];
}

/** 平台图标和标签 */
function PlatformBadge({ platform }: { platform: TutorialData["platform"] }) {
  if (platform === "bilibili") {
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

export function TutorialCardList({ tutorials }: TutorialCardListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // tutorialCardId → favoriteId 的映射
  const [favoriteMap, setFavoriteMap] = useState<Map<string, string>>(
    new Map()
  );
  // 正在请求中的 tutorialCardId 集合，防止重复点击
  const [pending, setPending] = useState<Set<string>>(new Set());

  // 已登录时，获取当前用户的收藏列表
  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) return;
        const data: FavoriteRecord[] = await res.json();
        if (cancelled) return;
        const map = new Map<string, string>();
        for (const fav of data) {
          map.set(fav.tutorialCardId, fav.id);
        }
        setFavoriteMap(map);
      } catch {
        // 静默失败
      }
    }

    fetchFavorites();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const toggleFavorite = useCallback(
    async (tutorial: TutorialData) => {
      // 未登录 → 跳转登录页
      if (status !== "authenticated" || !session?.user) {
        router.push("/login");
        return;
      }

      // 防止重复点击
      if (pending.has(tutorial.id)) return;

      setPending((prev) => new Set(prev).add(tutorial.id));

      const existingFavId = favoriteMap.get(tutorial.id);

      try {
        if (existingFavId) {
          // 取消收藏
          const res = await fetch(`/api/favorites/${existingFavId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setFavoriteMap((prev) => {
              const next = new Map(prev);
              next.delete(tutorial.id);
              return next;
            });
          }
        } else {
          // 添加收藏
          const res = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tutorialCardId: tutorial.id,
              muscleGroupId: tutorial.muscleGroupId,
            }),
          });
          if (res.ok) {
            const fav: FavoriteRecord = await res.json();
            setFavoriteMap((prev) => {
              const next = new Map(prev);
              next.set(tutorial.id, fav.id);
              return next;
            });
          }
        }
      } catch {
        // 静默失败
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(tutorial.id);
          return next;
        });
      }
    },
    [status, session, router, pending, favoriteMap]
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

      {/* 横向滚动容器 */}
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
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {tutorial.coverImage.startsWith("http") ? (
                  <Image
                    src={tutorial.coverImage}
                    alt={tutorial.title}
                    fill
                    sizes="220px"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground/40">
                    {tutorial.contentType === "video" ? (
                      <Play className="size-10" />
                    ) : (
                      <BookOpen className="size-10" />
                    )}
                  </div>
                )}

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
    </section>
  );
}
