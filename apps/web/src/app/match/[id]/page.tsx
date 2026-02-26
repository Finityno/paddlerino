"use client";

import { use } from "react";
import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";

import MatchView from "@/components/match/match-view";

export default function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <MatchView matchId={id as Id<"matches">} />;
}
