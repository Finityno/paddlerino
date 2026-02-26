"use client";

import { api } from "@paddlerino/backend/convex/_generated/api";
import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { optimisticallySetScore } from "./optimistic-score";
import ScoreButton from "./score-button";

interface Player {
  _id: Id<"players">;
  name: string;
}

interface PlayerScore {
  _id: Id<"sessionPlayers">;
  playerId: Id<"players">;
  score: number;
}

interface ActiveSessionData {
  _id: Id<"sessions">;
  sessionNumber: number;
  status: "in_progress" | "completed";
  playerScores: PlayerScore[];
}

interface ActiveSessionProps {
  matchId: Id<"matches">;
  session: ActiveSessionData | null | undefined;
  players: Player[];
}

export default function ActiveSession({
  session,
  players,
}: ActiveSessionProps) {
  const endSession = useMutation(api.sessions.end);
  const setScore = useMutation(api.sessions.setScore).withOptimisticUpdate(
    (localStore, args) => {
      optimisticallySetScore(localStore, args);
    },
  );
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setScoreDrafts({});
  }, [session?._id]);

  if (session === undefined) return null;

  if (session === null) {
    return (
      <Card>
        <CardPanel>
          <p className="text-center text-sm text-muted-foreground py-4">
            No active session. Start a new one below.
          </p>
        </CardPanel>
      </Card>
    );
  }

  const playerMap = new Map(players.map((p) => [p._id, p.name]));
  const sorted = [...session.playerScores].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;

  const clearScoreDraft = (sessionPlayerId: Id<"sessionPlayers">) => {
    setScoreDrafts((prev) => {
      const next = { ...prev };
      delete next[sessionPlayerId];
      return next;
    });
  };

  const commitScore = async (playerScore: PlayerScore) => {
    const draft = scoreDrafts[playerScore._id];
    if (draft === undefined) return;

    const parsedScore = Number.parseInt(draft, 10);
    if (!Number.isFinite(parsedScore)) {
      clearScoreDraft(playerScore._id);
      return;
    }

    const normalizedScore = Math.max(0, parsedScore);
    if (normalizedScore === playerScore.score) {
      clearScoreDraft(playerScore._id);
      return;
    }

    clearScoreDraft(playerScore._id);
    try {
      await setScore({
        sessionPlayerId: playerScore._id,
        score: normalizedScore,
      });
    } catch (err) {
      setScoreDrafts((prev) => ({
        ...prev,
        [playerScore._id]: draft,
      }));
      toast.error(err instanceof Error ? err.message : "Failed to update score");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Session {session.sessionNumber}</CardTitle>
      </CardHeader>
      <CardPanel className="space-y-3">
        {sorted.map((ps) => {
          const isLeading = topScore > 0 && ps.score === topScore;
          return (
            <div
              key={ps._id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium truncate ${isLeading ? "text-primary" : ""}`}
                  >
                    {playerMap.get(ps.playerId) ?? "?"}
                  </span>
                  {isLeading && (
                    <Badge variant="success" size="sm">
                      Lead
                    </Badge>
                  )}
                </div>
              </div>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={scoreDrafts[ps._id] ?? String(ps.score)}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  if (!/^\d*$/.test(nextValue)) return;
                  setScoreDrafts((prev) => ({
                    ...prev,
                    [ps._id]: nextValue,
                  }));
                }}
                onBlur={() => void commitScore(ps)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  e.currentTarget.blur();
                }}
                aria-label={`${playerMap.get(ps.playerId) ?? "Player"} score`}
                className={`w-20 rounded-md border border-input bg-background px-2 py-1 text-center text-xl leading-none font-bold tabular-nums outline-none ring-ring/24 transition-shadow focus:border-ring focus:ring-[3px] ${
                  isLeading ? "text-primary" : "text-muted-foreground"
                }`}
              />

              <div className="flex items-center gap-1">
                <ScoreButton sessionPlayerId={ps._id} delta={1} size="lg" />
                <ScoreButton sessionPlayerId={ps._id} delta={2} size="lg" />
                <ScoreButton sessionPlayerId={ps._id} delta={3} size="lg" />
                <ScoreButton
                  sessionPlayerId={ps._id}
                  delta={-1}
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          );
        })}
      </CardPanel>
      <Separator />
      <CardFooter className="justify-center">
        <Dialog>
          <DialogTrigger render={<Button variant="destructive" size="sm" />}>
            End Session
          </DialogTrigger>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>End Session?</DialogTitle>
              <DialogDescription>
                {topScore > 0 && sorted.length > 0
                  ? `${playerMap.get(sorted[0].playerId)} leads with ${topScore} points.`
                  : "No scores recorded yet."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await endSession({ sessionId: session._id });
                    toast.success("Session ended");
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Failed to end session",
                    );
                  }
                }}
              >
                End Session
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
