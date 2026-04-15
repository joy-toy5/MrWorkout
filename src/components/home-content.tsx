"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MuscleMap } from "@/components/muscle-map/muscle-map";

type Gender = "male" | "female";

const MuscleDetailDialog = dynamic(
  () =>
    import("@/components/muscle-detail/muscle-detail-dialog").then(
      (mod) => mod.MuscleDetailDialog
    ),
  { ssr: false }
);

export function HomeContent() {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentGender, setCurrentGender] = useState<Gender>("male");

  const handleMuscleClick = (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setDialogOpen(true);
  };

  return (
    <>
      <MuscleMap
        onMuscleClick={handleMuscleClick}
        onGenderChange={setCurrentGender}
      />

      {dialogOpen && (
        <MuscleDetailDialog
          muscleId={selectedMuscle}
          defaultGender={currentGender}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  );
}
