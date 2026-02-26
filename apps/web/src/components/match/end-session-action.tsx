"use client";

import { api } from "@paddlerino/backend/convex/_generated/api";
import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

interface EndSessionActionProps {
  session: ActiveSessionData | null | undefined;
  players: Player[];
}

export default function EndSessionAction({
  session,
  players,
}: EndSessionActionProps) {
  const endSession = useMutation(api.sessions.end);

  if (session === undefined || session === null) return null;

  const playerMap = new Map(players.map((player) => [player._id, player.name]));
  const topScore = session.playerScores.reduce(
    (highest, playerScore) => Math.max(highest, playerScore.score),
    0,
  );
  const leaders = session.playerScores.filter(
    (playerScore) => playerScore.score === topScore,
  );
  const uniqueLeader = topScore > 0 && leaders.length === 1 ? leaders[0] : null;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="w-full" variant="destructive" size="lg" />
        }
      >
        End Session
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>End Session?</DialogTitle>
          <DialogDescription>
            {uniqueLeader
              ? `${playerMap.get(uniqueLeader.playerId)} leads with ${topScore} points.`
              : topScore > 0
                ? `${leaders.length} players are tied at ${topScore} points.`
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
                  err instanceof Error ? err.message : "Failed to end session",
                );
              }
            }}
          >
            End Session
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
