"use client";

import { MuscleMap } from "@/components/muscle-map/muscle-map";

export default function Home() {
  const handleMuscleClick = (muscleId: string) => {
    // TODO: 阶段五完成后打开 MuscleDetailDialog 弹窗
    console.log("点击肌群:", muscleId);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 text-center">
        人体肌肉示意图
      </h1>
      <MuscleMap onMuscleClick={handleMuscleClick} />
    </div>
  );
}
