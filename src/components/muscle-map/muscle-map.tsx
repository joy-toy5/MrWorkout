"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type Gender = "male" | "female";
type View = "front" | "back";

interface MuscleMapProps {
  onMuscleClick?: (muscleId: string) => void;
  onGenderChange?: (gender: Gender) => void;
}

const SVG_MAP: Record<`${Gender}-${View}`, string> = {
  "male-front": "/images/body-maps/male-front.svg",
  "male-back": "/images/body-maps/male-back.svg",
  "female-front": "/images/body-maps/female-front.svg",
  "female-back": "/images/body-maps/female-back.svg",
};

export function MuscleMap({ onMuscleClick, onGenderChange }: MuscleMapProps) {
  const [gender, setGender] = useState<Gender>("male");
  const [view, setView] = useState<View>("front");
  const [svgContent, setSvgContent] = useState<string>("");
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // --- 缩放与拖拽状态 ---
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const lastTranslate = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const lastScale = useRef(1);

  const MIN_SCALE = 1;
  const MAX_SCALE = 3;

  // 加载 SVG 内容
  useEffect(() => {
    const key = `${gender}-${view}` as const;
    const url = SVG_MAP[key];

    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        setSvgContent(text);
      })
      .catch((err) => {
        console.error("Failed to load SVG:", err);
      });
  }, [gender, view]);

  // 切换性别/视图时重置缩放
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    lastScale.current = 1;
    lastTranslate.current = { x: 0, y: 0 };
  }, [gender, view]);

  // 绑定 SVG 肌群热区事件 — 直接操作 DOM，不依赖 React state
  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container || !svgContent) return;

    const zones = container.querySelectorAll<SVGElement>(".muscle-zone");
    const labels = container.querySelectorAll<SVGElement>(".muscle-label");

    // 记录每个热区元素的原始 fill-opacity
    const originalOpacities = new Map<SVGElement, string>();
    zones.forEach((zone) => {
      originalOpacities.set(
        zone,
        zone.getAttribute("fill-opacity") || "0.5"
      );
      zone.style.cursor = "pointer";
      zone.style.transition = "fill-opacity 0.15s, filter 0.15s";
    });

    // 记录每个标签元素的原始 fill
    const originalLabelFills = new Map<SVGElement, string>();
    labels.forEach((label) => {
      originalLabelFills.set(label, label.getAttribute("fill") || "#111827");
      label.style.cursor = "pointer";
      label.style.transition = "fill 0.15s";
    });

    // 高亮指定 muscleId 的所有热区 + 标签
    const highlightMuscle = (muscleId: string) => {
      zones.forEach((zone) => {
        if (zone.getAttribute("data-muscle-id") === muscleId) {
          zone.setAttribute("fill-opacity", "0.9");
          zone.style.filter = "brightness(1.3) saturate(1.5) drop-shadow(0 0 6px rgba(0,0,0,0.3))";
        }
      });
      labels.forEach((label) => {
        if (label.getAttribute("data-muscle-id") === muscleId) {
          label.setAttribute("fill", "#2563eb");
        }
      });
    };

    // 恢复所有元素到原始状态
    const resetAll = () => {
      zones.forEach((zone) => {
        zone.setAttribute("fill-opacity", originalOpacities.get(zone) || "0.5");
        zone.style.filter = "none";
      });
      labels.forEach((label) => {
        label.setAttribute("fill", originalLabelFills.get(label) || "#111827");
      });
    };

    const handleMouseEnter = (e: Event) => {
      const el = e.currentTarget as SVGElement;
      const muscleId = el.getAttribute("data-muscle-id");
      if (!muscleId) return;
      resetAll();
      highlightMuscle(muscleId);
    };

    const handleMouseLeave = (e: Event) => {
      const el = e.currentTarget as SVGElement;
      const related = (e as MouseEvent).relatedTarget as Element | null;
      if (related) {
        const relatedMuscle = (related as SVGElement).getAttribute?.("data-muscle-id");
        const currentMuscle = el.getAttribute("data-muscle-id");
        if (relatedMuscle && relatedMuscle === currentMuscle) return;
      }
      resetAll();
    };

    const handleClick = (e: Event) => {
      const el = e.currentTarget as SVGElement;
      const muscleId = el.getAttribute("data-muscle-id");
      if (muscleId && onMuscleClick) {
        onMuscleClick(muscleId);
      }
    };

    // 绑定热区事件
    zones.forEach((zone) => {
      zone.addEventListener("mouseenter", handleMouseEnter);
      zone.addEventListener("mouseleave", handleMouseLeave);
      zone.addEventListener("click", handleClick);
    });

    // 绑定标签事件（点击 + 悬停联动）
    labels.forEach((label) => {
      label.addEventListener("mouseenter", handleMouseEnter);
      label.addEventListener("mouseleave", handleMouseLeave);
      label.addEventListener("click", handleClick);
    });

    return () => {
      zones.forEach((zone) => {
        zone.removeEventListener("mouseenter", handleMouseEnter);
        zone.removeEventListener("mouseleave", handleMouseLeave);
        zone.removeEventListener("click", handleClick);
      });
      labels.forEach((label) => {
        label.removeEventListener("mouseenter", handleMouseEnter);
        label.removeEventListener("mouseleave", handleMouseLeave);
        label.removeEventListener("click", handleClick);
      });
    };
  }, [svgContent, onMuscleClick]);

  // --- 触摸手势处理 ---
  const getTouchDistance = (t0: React.Touch, t1: React.Touch) => {
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 双指缩放开始
      lastPinchDist.current = getTouchDistance(e.touches[0], e.touches[1]);
      lastScale.current = scale;
      e.preventDefault();
    } else if (e.touches.length === 1 && scale > 1) {
      // 单指拖拽（仅在缩放状态下）
      isPanning.current = true;
      panStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastTranslate.current = { ...translate };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, translate]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      // 双指缩放
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const ratio = dist / lastPinchDist.current;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, lastScale.current * ratio));
      setScale(newScale);
      e.preventDefault();
    } else if (e.touches.length === 1 && isPanning.current) {
      // 单指拖拽
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setTranslate({
        x: lastTranslate.current.x + dx,
        y: lastTranslate.current.y + dy,
      });
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
    isPanning.current = false;
    lastScale.current = scale;
    lastTranslate.current = { ...translate };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, translate]);

  // 重置缩放
  const resetZoom = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    lastScale.current = 1;
    lastTranslate.current = { x: 0, y: 0 };
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 性别切换 */}
      <Tabs
        defaultValue="male"
        onValueChange={(val) => {
          const g = val as Gender;
          setGender(g);
          onGenderChange?.(g);
        }}
      >
        <TabsList className="mx-auto">
          <TabsTrigger value="male">男性</TabsTrigger>
          <TabsTrigger value="female">女性</TabsTrigger>
        </TabsList>

        {/* TabsContent 仅用于语义结构，实际渲染由下方 SVG 容器统一处理 */}
        <TabsContent value="male" />
        <TabsContent value="female" />
      </Tabs>

      {/* 正面/背面切换 */}
      <div className="flex items-center gap-2">
        <Button
          variant={view === "front" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("front")}
        >
          正面
        </Button>
        <Button
          variant={view === "back" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("back")}
        >
          背面
        </Button>
      </div>

      {/* SVG 容器 */}
      <div className="relative w-full max-w-lg mx-auto overflow-hidden touch-none select-none">
        {/* 缩放重置按钮 */}
        {scale > 1 && (
          <button
            onClick={resetZoom}
            className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-background/80 backdrop-blur px-2.5 py-1.5 text-xs font-medium shadow-sm border border-border hover:bg-muted transition-colors"
          >
            <RotateCcw className="size-3.5" />
            重置
          </button>
        )}

        <div
          ref={svgContainerRef}
          className="w-full [&_svg]:w-full [&_svg]:h-auto"
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transformOrigin: "center center",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {/* 提示文字 */}
      <p className="text-xs text-muted-foreground text-center">
        点击肌群区域查看详情
        <span className="hidden sm:inline"> · 鼠标悬停高亮</span>
        <span className="sm:hidden"> · 双指缩放，单指拖拽</span>
      </p>
    </div>
  );
}
