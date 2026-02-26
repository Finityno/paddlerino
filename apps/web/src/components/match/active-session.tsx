"use client";

import { api } from "@paddlerino/backend/convex/_generated/api";
import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FrameTitle,
} from "@/components/ui/frame";
import { Group, GroupSeparator } from "@/components/ui/group";
import { Input } from "@/components/ui/input";

import { optimisticallySetScore } from "./optimistic-score";

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
  session: ActiveSessionData | null | undefined;
  players: Player[];
}

export default function ActiveSession({
  session,
  players,
}: ActiveSessionProps) {
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
      <Frame>
        <FrameHeader>
          <FrameTitle>Session</FrameTitle>
          <FrameDescription>No active session right now.</FrameDescription>
        </FrameHeader>
        <Card>
          <CardPanel>
            <p className="text-center text-sm text-muted-foreground py-4">
              No active session. Start a new one below.
            </p>
          </CardPanel>
        </Card>
        <FrameFooter>
          <p className="text-xs text-muted-foreground">
            Start a new session to begin live scoring.
          </p>
        </FrameFooter>
      </Frame>
    );
  }

  const playerMap = new Map(players.map((p) => [p._id, p.name]));
  const playerScores = session.playerScores;
  const topScore = playerScores.reduce(
    (highest, playerScore) => Math.max(highest, playerScore.score),
    0,
  );

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
    <Frame>
      <FrameHeader>
        <FrameTitle>Session {session.sessionNumber}</FrameTitle>
        <FrameDescription>
          Live scoring. Type a score and confirm with the checkmark.
        </FrameDescription>
      </FrameHeader>

      <Card>
        <CardPanel className="space-y-3">
          {playerScores.map((ps) => {
            const isLeading = topScore > 0 && ps.score === topScore;
            return (
              <div
                key={ps._id}
                className="flex items-center gap-3 rounded-lg p-3"
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

                <Group
                  className="w-36 shrink-0"
                  aria-label={`${playerMap.get(ps.playerId) ?? "Player"} score input`}
                >
                  <Input
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
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      void commitScore(ps);
                    }}
                    aria-label={`${playerMap.get(ps.playerId) ?? "Player"} score`}
                    className={`text-center text-xl font-bold tabular-nums ${
                      isLeading ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <GroupSeparator />
                  <Button
                    variant="outline"
                    size="icon-lg"
                    aria-label={`Apply ${playerMap.get(ps.playerId) ?? "player"} score`}
                    disabled={scoreDrafts[ps._id] === undefined}
                    onClick={() => void commitScore(ps)}
                  >
                    <CheckIcon />
                  </Button>
                </Group>
              </div>
            );
          })}
        </CardPanel>
      </Card>

      <FrameFooter>
        <p className="text-xs text-muted-foreground">
          Use the full-width action at the bottom of the page to end this
          session.
        </p>
      </FrameFooter>
    </Frame>
  );
}
