"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  Dumbbell,
  Info,
  ListOrdered,
  Zap,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { TutorialCardList } from "./tutorial-card-list";
import musclesData from "@/data/muscles.json";
import tutorialsData from "@/data/tutorials.json";

type Gender = "male" | "female";

interface MuscleData {
  id: string;
  nameZh: string;
  nameEn: string;
  category: string;
  introduction: string;
  functions: string[];
  male: {
    exercises: string[];
    precautions: string[];
  };
  female: {
    exercises: string[];
    precautions: string[];
  };
  view: string;
}

interface TutorialData {
  id: string;
  muscleGroupId: string;
  title: string;
  coverImage: string;
  sourceUrl: string;
  platform: "bilibili" | "xiaohongshu";
  contentType: "video" | "image_text";
}

interface MuscleDetailDialogProps {
  muscleId: string | null;
  defaultGender: Gender;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** SSR-safe media query hook */
const MD_QUERY = "(min-width: 768px)";
const subscribe = (cb: () => void) => {
  const mql = window.matchMedia(MD_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const getSnapshot = () => window.matchMedia(MD_QUERY).matches;
const getServerSnapshot = () => true; // SSR 默认桌面端

function useIsDesktop() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** 查找肌群数据 */
function findMuscle(muscleId: string): MuscleData | undefined {
  return (musclesData as MuscleData[]).find((m) => m.id === muscleId);
}

/** 查找该肌群关联的教程卡片 */
function findTutorials(muscleId: string): TutorialData[] {
  return (tutorialsData as TutorialData[]).filter(
    (t) => t.muscleGroupId === muscleId
  );
}

/** 弹窗内部内容 — 桌面端和移动端共用 */
function MuscleDetailContent({
  muscle,
  tutorials,
  defaultGender,
}: {
  muscle: MuscleData;
  tutorials: TutorialData[];
  defaultGender: Gender;
}) {
  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* 基础介绍 */}
      <section>
        <div className="flex items-center gap-1.5 mb-2 text-sm font-medium text-muted-foreground">
          <Info className="size-4" />
          基础介绍
        </div>
        <p className="text-sm leading-relaxed">{muscle.introduction}</p>
      </section>

      {/* 主要作用 */}
      <section>
        <div className="flex items-center gap-1.5 mb-2 text-sm font-medium text-muted-foreground">
          <Zap className="size-4" />
          主要作用
        </div>
        <ol className="list-decimal list-inside space-y-1 text-sm leading-relaxed">
          {muscle.functions.map((fn, i) => (
            <li key={i}>{fn}</li>
          ))}
        </ol>
      </section>

      {/* 男/女训练侧重切换 */}
      <Tabs defaultValue={defaultGender}>
        <TabsList className="mx-auto">
          <TabsTrigger value="male">男性训练</TabsTrigger>
          <TabsTrigger value="female">女性训练</TabsTrigger>
        </TabsList>

        {(["male", "female"] as const).map((g) => (
          <TabsContent key={g} value={g} className="space-y-4 mt-2">
            {/* 常见训练方式 */}
            <section>
              <div className="flex items-center gap-1.5 mb-2 text-sm font-medium text-muted-foreground">
                <Dumbbell className="size-4" />
                常见训练方式
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-sm leading-relaxed">
                {muscle[g].exercises.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ol>
            </section>

            {/* 注意事项 */}
            <section>
              <div className="flex items-center gap-1.5 mb-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="size-4" />
                注意事项
              </div>
              <ul className="space-y-1.5 text-sm leading-relaxed">
                {muscle[g].precautions.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ListOrdered className="size-3.5 mt-0.5 shrink-0 text-amber-500" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          </TabsContent>
        ))}
      </Tabs>

      {/* 相关教程卡片 */}
      {tutorials.length > 0 && (
        <TutorialCardList tutorials={tutorials} />
      )}
    </div>
  );
}

export function MuscleDetailDialog({
  muscleId,
  defaultGender,
  open,
  onOpenChange,
}: MuscleDetailDialogProps) {
  const isDesktop = useIsDesktop();

  const muscle = useMemo(
    () => (muscleId ? findMuscle(muscleId) : undefined),
    [muscleId]
  );

  const tutorials = useMemo(
    () => (muscleId ? findTutorials(muscleId) : []),
    [muscleId]
  );

  if (!muscle || !open) return null;

  const title = (
    <>
      <span>{muscle.nameZh}</span>
      <span className="ml-2 text-sm font-normal text-muted-foreground">
        {muscle.nameEn}
      </span>
    </>
  );

  const description = `${muscle.category} · ${muscle.functions.length} 项主要作用 · ${tutorials.length} 个相关教程`;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <MuscleDetailContent
            muscle={muscle}
            tutorials={tutorials}
            defaultGender={defaultGender}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl px-4 pb-6">
        <SheetHeader className="sticky top-0 z-10 bg-popover pb-3 -mx-4 px-4 pt-4 border-b">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="pt-4">
          <MuscleDetailContent
            muscle={muscle}
            tutorials={tutorials}
            defaultGender={defaultGender}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
