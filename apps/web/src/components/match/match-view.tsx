"use client";

import { api } from "@paddlerino/backend/convex/_generated/api";
import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";

import { Spinner } from "@/components/ui/spinner";

import ActiveSession from "./active-session";
import EndSessionAction from "./end-session-action";
import Leaderboard from "./leaderboard";
import MatchHeader from "./match-header";
import SessionList from "./session-list";

export default function MatchView({ matchId }: { matchId: Id<"matches"> }) {
  const match = useQuery(api.matches.get, { matchId });
  const leaderboard = useQuery(api.leaderboard.get, { matchId });
  const sessions = useQuery(api.sessions.list, { matchId });
  const activeSession = useQuery(api.sessions.getActive, { matchId });

  if (match === undefined) {
    return (
      <div className="flex justify-center pt-12">
        <Spinner />
      </div>
    );
  }

  if (match === null) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Match not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-4 space-y-6">
      <MatchHeader match={match} />
      <ActiveSession session={activeSession} players={match.players} />
      <Leaderboard leaderboard={leaderboard} />
      <SessionList
        sessions={sessions}
        players={match.players}
        matchId={matchId}
        hasActiveSession={activeSession !== null && activeSession !== undefined}
      />
      <EndSessionAction session={activeSession} players={match.players} />
    </div>
  );
}
