"use client";

import { api } from "@paddlerino/backend/convex/_generated/api";
import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";

import { Button } from "@/components/ui/button";

import { optimisticallyApplyScoreDelta } from "./optimistic-score";

interface ScoreButtonProps {
  sessionPlayerId: Id<"sessionPlayers">;
  delta: number;
  variant?: "default" | "outline";
  size?: "default" | "lg" | "sm";
}

export default function ScoreButton({
  sessionPlayerId,
  delta,
  variant = "default",
  size = "default",
}: ScoreButtonProps) {
  const updateScore = useMutation(
    api.sessions.updateScore,
  ).withOptimisticUpdate((localStore, args) => {
    optimisticallyApplyScoreDelta(localStore, args);
  });

  return (
    <Button
      variant={variant}
      size={size}
      className="min-w-9 tabular-nums"
      onClick={() => updateScore({ sessionPlayerId, delta })}
    >
      {delta > 0 ? `+${delta}` : delta}
    </Button>
  );
}
