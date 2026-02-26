"use client";

import { use } from "react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";

import MatchView from "@/components/match/match-view";
import { Spinner } from "@/components/ui/spinner";

export default function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <AuthLoading>
        <div className="flex justify-center pt-12">
          <Spinner />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-8 text-center text-muted-foreground">
          Please sign in to view this match.
        </div>
      </Unauthenticated>
      <Authenticated>
        <MatchView matchId={id as Id<"matches">} />
      </Authenticated>
    </>
  );
}
