"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface FavoriteRecord {
  id: string;
  tutorialCardId: string;
  muscleGroupId: string;
}

interface FavoritesContextValue {
  /** tutorialCardId → favoriteId 映射 */
  favoriteMap: Map<string, string>;
  /** tutorialCardId → muscleGroupId 映射（用于个人中心分组） */
  muscleGroupMap: Map<string, string>;
  /** 正在请求中的 tutorialCardId 集合 */
  pending: Set<string>;
  /** 添加收藏 */
  addFavorite: (tutorialCardId: string, muscleGroupId: string) => Promise<boolean>;
  /** 取消收藏 */
  removeFavorite: (tutorialCardId: string) => Promise<boolean>;
  /** 通过 favoriteId 取消收藏（个人中心使用） */
  removeFavoriteById: (favoriteId: string, tutorialCardId: string) => Promise<boolean>;
  /** 是否正在加载收藏列表 */
  loading: boolean;
  /** 强制刷新收藏列表 */
  refresh: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [favoriteMap, setFavoriteMap] = useState<Map<string, string>>(new Map());
  const [muscleGroupMap, setMuscleGroupMap] = useState<Map<string, string>>(new Map());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // 使用 ref 存储最新状态，避免 useCallback 依赖变化导致重渲染
  const favoriteMapRef = useRef(favoriteMap);
  favoriteMapRef.current = favoriteMap;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  // 已登录时获取收藏列表
  useEffect(() => {
    if (status !== "authenticated") {
      setFavoriteMap(new Map());
      setMuscleGroupMap(new Map());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) return;
        const data: FavoriteRecord[] = await res.json();
        if (cancelled) return;

        const favMap = new Map<string, string>();
        const mgMap = new Map<string, string>();
        for (const fav of data) {
          favMap.set(fav.tutorialCardId, fav.id);
          mgMap.set(fav.tutorialCardId, fav.muscleGroupId);
        }
        setFavoriteMap(favMap);
        setMuscleGroupMap(mgMap);
      } catch {
        // 初始加载失败时静默处理（不弹 toast，避免首屏干扰）
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFavorites();
    return () => {
      cancelled = true;
    };
  }, [status, refreshToken]);

  const addFavorite = useCallback(
    async (tutorialCardId: string, muscleGroupId: string): Promise<boolean> => {
      if (pendingRef.current.has(tutorialCardId)) return false;

      setPending((prev) => new Set(prev).add(tutorialCardId));

      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tutorialCardId, muscleGroupId }),
        });

        if (res.ok) {
          const fav: { id: string } = await res.json();
          setFavoriteMap((prev) => {
            const next = new Map(prev);
            next.set(tutorialCardId, fav.id);
            return next;
          });
          setMuscleGroupMap((prev) => {
            const next = new Map(prev);
            next.set(tutorialCardId, muscleGroupId);
            return next;
          });
          return true;
        }
        toast.error("收藏失败，请稍后重试");
        return false;
      } catch {
        toast.error("网络错误，收藏失败");
        return false;
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(tutorialCardId);
          return next;
        });
      }
    },
    []
  );

  const removeFavorite = useCallback(
    async (tutorialCardId: string): Promise<boolean> => {
      const favoriteId = favoriteMapRef.current.get(tutorialCardId);
      if (!favoriteId) return false;
      if (pendingRef.current.has(tutorialCardId)) return false;

      setPending((prev) => new Set(prev).add(tutorialCardId));

      try {
        const res = await fetch(`/api/favorites/${favoriteId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setFavoriteMap((prev) => {
            const next = new Map(prev);
            next.delete(tutorialCardId);
            return next;
          });
          setMuscleGroupMap((prev) => {
            const next = new Map(prev);
            next.delete(tutorialCardId);
            return next;
          });
          return true;
        }
        toast.error("取消收藏失败，请稍后重试");
        return false;
      } catch {
        toast.error("网络错误，取消收藏失败");
        return false;
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(tutorialCardId);
          return next;
        });
      }
    },
    []
  );

  const removeFavoriteById = useCallback(
    async (favoriteId: string, tutorialCardId: string): Promise<boolean> => {
      if (pendingRef.current.has(tutorialCardId)) return false;

      setPending((prev) => new Set(prev).add(tutorialCardId));

      try {
        const res = await fetch(`/api/favorites/${favoriteId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setFavoriteMap((prev) => {
            const next = new Map(prev);
            next.delete(tutorialCardId);
            return next;
          });
          setMuscleGroupMap((prev) => {
            const next = new Map(prev);
            next.delete(tutorialCardId);
            return next;
          });
          return true;
        }
        toast.error("取消收藏失败，请稍后重试");
        return false;
      } catch {
        toast.error("网络错误，取消收藏失败");
        return false;
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(tutorialCardId);
          return next;
        });
      }
    },
    []
  );

  const refresh = useCallback(() => {
    setRefreshToken((n) => n + 1);
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteMap,
        muscleGroupMap,
        pending,
        addFavorite,
        removeFavorite,
        removeFavoriteById,
        loading,
        refresh,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites 必须在 FavoritesProvider 内使用");
  }
  return ctx;
}
