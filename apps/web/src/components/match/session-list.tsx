"use client";

import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";

import { Badge } from "@/components/ui/badge";
import { Card, CardPanel } from "@/components/ui/card";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FrameTitle,
} from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";

import NewSessionDialog from "./new-session-dialog";

interface Player {
  _id: Id<"players">;
  name: string;
}

interface PlayerScore {
  _id: Id<"sessionPlayers">;
  playerId: Id<"players">;
  score: number;
}

interface Session {
  _id: Id<"sessions">;
  sessionNumber: number;
  status: "in_progress" | "completed";
  playerScores: PlayerScore[];
}

interface SessionListProps {
  sessions: Session[] | undefined;
  players: Player[];
  matchId: Id<"matches">;
  hasActiveSession: boolean;
}

export default function SessionList({
  sessions,
  players,
  matchId,
  hasActiveSession,
}: SessionListProps) {
  const completedSessions = sessions?.filter((s) => s.status === "completed");
  const completedCount = completedSessions?.length ?? 0;

  return (
    <Frame>
      <FrameHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <FrameTitle>Sessions</FrameTitle>
          <FrameDescription>Completed rounds and final scores.</FrameDescription>
        </div>
        <NewSessionDialog
          matchId={matchId}
          players={players}
          disabled={hasActiveSession || players.length < 2}
        />
      </FrameHeader>

      <Card>
        <CardPanel>
          {sessions === undefined ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : completedCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed sessions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {completedSessions
                ?.sort((a, b) => b.sessionNumber - a.sessionNumber)
                .map((session) => {
                  const playerMap = new Map(
                    players.map((p) => [p._id, p.name]),
                  );
                  const sorted = [...session.playerScores].sort(
                    (a, b) => b.score - a.score,
                  );
                  const topScore = sorted[0]?.score ?? 0;

                  return (
                    <Card key={session._id}>
                      <CardPanel className="space-y-3 py-3">
                        <p className="text-sm font-semibold">
                          Session {session.sessionNumber}
                        </p>
                        <div className="space-y-1">
                          {sorted.map((ps, index) => {
                            const isWinner =
                              topScore > 0 &&
                              ps.score === topScore &&
                              sorted.filter((p) => p.score === topScore)
                                .length === 1;
                            return (
                              <div
                                key={ps._id}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-4 text-center text-muted-foreground">
                                    {index + 1}
                                  </span>
                                  <span className={isWinner ? "font-semibold" : ""}>
                                    {playerMap.get(ps.playerId) ?? "?"}
                                  </span>
                                  {isWinner && (
                                    <Badge variant="success" size="sm">
                                      Win
                                    </Badge>
                                  )}
                                </div>
                                <span className="tabular-nums font-medium">
                                  {ps.score}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardPanel>
                    </Card>
                  );
                })}
            </div>
          )}
        </CardPanel>
      </Card>

      <FrameFooter>
        <p className="text-xs text-muted-foreground">
          {completedCount === 0
            ? "Start a session to build match history."
            : `${completedCount} completed session${completedCount === 1 ? "" : "s"}.`}
        </p>
      </FrameFooter>
    </Frame>
  );
}
