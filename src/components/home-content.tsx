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
  const [interactionResetToken, setInteractionResetToken] = useState(0);

  const handleMuscleClick = (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setInteractionResetToken((token) => token + 1);
    }
  };

  return (
    <>
      <MuscleMap
        onMuscleClick={handleMuscleClick}
        onGenderChange={setCurrentGender}
        interactionResetToken={interactionResetToken}
      />

      {dialogOpen && (
        <MuscleDetailDialog
          muscleId={selectedMuscle}
          defaultGender={currentGender}
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
        />
      )}
    </>
  );
}
