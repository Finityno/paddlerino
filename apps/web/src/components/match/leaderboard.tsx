"use client";

import { Trophy } from "lucide-react";

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

interface LeaderboardEntry {
  _id: string;
  name: string;
  wins: number;
  sessionsPlayed: number;
  totalPoints: number;
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[] | undefined;
}

export default function Leaderboard({ leaderboard }: LeaderboardProps) {
  const playersWithWins =
    leaderboard?.filter((player) => player.wins > 0).length ?? 0;

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Leaderboard</FrameTitle>
        <FrameDescription>
          Ranked by wins, then points, then sessions played.
        </FrameDescription>
      </FrameHeader>

      <Card>
        <CardPanel>
          {leaderboard === undefined ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add players to get started.
            </p>
          ) : leaderboard.every((p) => p.sessionsPlayed === 0) ? (
            <div className="space-y-2">
              {leaderboard.map((player) => (
                <div
                  key={player._id}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm">{player.name}</span>
                  <span className="text-xs text-muted-foreground">
                    No sessions yet
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((player, index) => (
                <div
                  key={player._id}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    {index === 0 && player.wins > 0 && (
                      <Trophy className="size-4 text-amber-500" />
                    )}
                    <span
                      className={
                        index === 0 && player.wins > 0 ? "font-semibold" : ""
                      }
                    >
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        index === 0 && player.wins > 0 ? "success" : "outline"
                      }
                      size="sm"
                    >
                      {player.wins}W
                    </Badge>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {player.totalPoints} pts
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {player.sessionsPlayed} played
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardPanel>
      </Card>

      <FrameFooter>
        <p className="text-xs text-muted-foreground">
          {leaderboard === undefined
            ? "Loading standings..."
            : `${playersWithWins} player${playersWithWins === 1 ? "" : "s"} with at least one win.`}
        </p>
      </FrameFooter>
    </Frame>
  );
}
