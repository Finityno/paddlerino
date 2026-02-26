import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export const get = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    const completedSessions = await ctx.db
      .query("sessions")
      .withIndex("by_matchId_and_status", (q) =>
        q.eq("matchId", args.matchId).eq("status", "completed"),
      )
      .collect();

    const sessionPlayers = await ctx.db
      .query("sessionPlayers")
      .withIndex("by_matchId_and_sessionId", (q) =>
        q.eq("matchId", args.matchId),
      )
      .collect();

    const playerScoresBySessionId = new Map<
      Id<"sessions">,
      Array<(typeof sessionPlayers)[number]>
    >();
    for (const sessionPlayer of sessionPlayers) {
      const scores = playerScoresBySessionId.get(sessionPlayer.sessionId);
      if (scores) {
        scores.push(sessionPlayer);
      } else {
        playerScoresBySessionId.set(sessionPlayer.sessionId, [sessionPlayer]);
      }
    }

    const winCounts = new Map<Id<"players">, number>();
    const sessionsPlayed = new Map<Id<"players">, number>();
    const totalPoints = new Map<Id<"players">, number>();

    for (const player of players) {
      winCounts.set(player._id, 0);
      sessionsPlayed.set(player._id, 0);
      totalPoints.set(player._id, 0);
    }

    for (const session of completedSessions) {
      const playerScores = playerScoresBySessionId.get(session._id) ?? [];
      let maxScore = -Infinity;
      let maxScoreCount = 0;
      let winningPlayerId: Id<"players"> | null = null;

      for (const ps of playerScores) {
        const playedCount = sessionsPlayed.get(ps.playerId);
        if (playedCount !== undefined) {
          sessionsPlayed.set(ps.playerId, playedCount + 1);
        }

        const playerPoints = totalPoints.get(ps.playerId);
        if (playerPoints !== undefined) {
          totalPoints.set(ps.playerId, playerPoints + ps.score);
        }

        if (ps.score > maxScore) {
          maxScore = ps.score;
          maxScoreCount = 1;
          winningPlayerId = ps.playerId;
        } else if (ps.score === maxScore) {
          maxScoreCount += 1;
          winningPlayerId = null;
        }
      }

      if (maxScore > 0 && maxScoreCount === 1 && winningPlayerId !== null) {
        const wins = winCounts.get(winningPlayerId);
        if (wins !== undefined) {
          winCounts.set(winningPlayerId, wins + 1);
        }
      }
    }

    return players
      .map((player) => ({
        _id: player._id,
        name: player.name,
        wins: winCounts.get(player._id) ?? 0,
        sessionsPlayed: sessionsPlayed.get(player._id) ?? 0,
        totalPoints: totalPoints.get(player._id) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.wins - a.wins ||
          b.totalPoints - a.totalPoints ||
          b.sessionsPlayed - a.sessionsPlayed,
      );
  },
});
