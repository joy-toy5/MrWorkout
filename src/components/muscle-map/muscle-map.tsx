"use client";

import { useCallback, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RotateCcw, RefreshCw } from "lucide-react";
import { useMuscleMapController } from "./use-muscle-map-controller";
import { useMuscleMapInteractions } from "./use-muscle-map-interactions";
import { useMuscleMapViewport } from "./use-muscle-map-viewport";
import type { Gender } from "./types";

interface MuscleMapProps {
  onMuscleClick?: (muscleId: string) => void;
  onGenderChange?: (gender: Gender) => void;
  interactionResetToken?: number;
}

export function MuscleMap({
  onMuscleClick,
  onGenderChange,
  interactionResetToken = 0,
}: MuscleMapProps) {
  const {
    didPanRef,
    resetViewport: resetViewportTransform,
    scale,
    touchHandlers,
    translate,
  } = useMuscleMapViewport();
  const clearInteractionRef = useRef<() => void>(() => {});
  const resetViewport = useCallback(() => {
    clearInteractionRef.current();
    resetViewportTransform();
  }, [resetViewportTransform]);
  const controller = useMuscleMapController({
    onGenderChange,
    onViewportReset: resetViewport,
  });
  const interactions = useMuscleMapInteractions({
    didPanRef,
    interactionResetToken,
    onMuscleClick,
    svgContent: controller.svgContent,
  });
  useEffect(() => {
    clearInteractionRef.current = interactions.clearInteractionState;
  }, [interactions.clearInteractionState]);
  const {
    outerContainerRef,
    svgContainerRef,
    tooltipRefs: {
      tooltipNameEnRef,
      tooltipNameZhRef,
      tooltipRef,
      tooltipTaglineRef,
    },
  } = interactions;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <Tabs
        value={controller.gender}
        onValueChange={(val) => {
          controller.changeGender(val as Gender);
        }}
      >
        <TabsList className="mx-auto">
          <TabsTrigger value="male">男性</TabsTrigger>
          <TabsTrigger value="female">女性</TabsTrigger>
        </TabsList>

        <TabsContent value="male" />
        <TabsContent value="female" />
      </Tabs>

      <div className="flex items-center gap-2">
        <Button
          variant={controller.view === "front" ? "default" : "outline"}
          size="sm"
          onClick={() => controller.switchView("front")}
          disabled={controller.isFlipping}
        >
          正面
        </Button>
        <Button
          variant={controller.view === "back" ? "default" : "outline"}
          size="sm"
          onClick={() => controller.switchView("back")}
          disabled={controller.isFlipping}
        >
          背面
        </Button>
      </div>

      <div
        ref={outerContainerRef}
        className="relative w-full max-w-lg mx-auto select-none"
      >
        <div className="relative overflow-hidden touch-none">
          {scale > 1 && (
            <button
              onClick={resetViewport}
              className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-background/80 backdrop-blur px-2.5 py-1.5 text-xs font-medium shadow-sm border border-border hover:bg-muted transition-colors"
            >
              <RotateCcw className="size-3.5" />
              重置
            </button>
          )}

          {controller.svgError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
              <p className="text-sm">示意图加载失败</p>
              <Button
                variant="outline"
                size="sm"
                onClick={controller.retryLoad}
              >
                <RefreshCw className="size-3.5 mr-1.5" />
                重试
              </Button>
            </div>
          ) : (
            <div
              className="[perspective:1000px]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                style={{
                  transform: `rotateY(${controller.flipRotation}deg)`,
                  transition: controller.flipTransition
                    ? "transform 250ms ease-in-out"
                    : "none",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                <div
                  key={controller.svgKey}
                  ref={svgContainerRef}
                  className="w-full text-foreground [&_svg]:w-full [&_svg]:h-auto [&_.body-outline]:stroke-muted-foreground"
                  style={{
                    transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
                    transformOrigin: "center center",
                  }}
                  {...touchHandlers}
                />
              </div>
            </div>
          )}
        </div>

        <div
          ref={tooltipRef}
          hidden
          className="pointer-events-none absolute z-20 max-sm:hidden w-max max-w-none whitespace-nowrap rounded-lg border bg-popover px-3 py-2 shadow-lg"
        >
          <p
            ref={tooltipNameZhRef}
            className="text-sm font-semibold text-popover-foreground"
          />
          <p
            ref={tooltipNameEnRef}
            className="text-xs text-muted-foreground"
          />
          <p
            ref={tooltipTaglineRef}
            className="mt-1 text-xs text-popover-foreground/80"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        点击肌群区域查看详情
        <span className="hidden sm:inline"> · 鼠标悬停高亮</span>
        <span className="sm:hidden"> · 双指缩放，单指拖拽</span>
      </p>
    </div>
  );
}
