import { v } from "convex/values";
import { query } from "./_generated/server";

export const get = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    const completedSessions = sessions.filter((s) => s.status === "completed");

    const winCounts: Record<string, number> = {};
    const sessionsPlayed: Record<string, number> = {};
    const totalPoints: Record<string, number> = {};

    for (const player of players) {
      winCounts[player._id] = 0;
      sessionsPlayed[player._id] = 0;
      totalPoints[player._id] = 0;
    }

    for (const session of completedSessions) {
      const playerScores = await ctx.db
        .query("sessionPlayers")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
        .collect();

      // Find the highest score in this session
      let maxScore = 0;
      for (const ps of playerScores) {
        if (ps.score > maxScore) maxScore = ps.score;
      }

      for (const ps of playerScores) {
        if (sessionsPlayed[ps.playerId] !== undefined) {
          sessionsPlayed[ps.playerId]++;
          totalPoints[ps.playerId] += ps.score;
        }
        // Winner is whoever has the highest score (ties = no winner)
        if (
          maxScore > 0 &&
          ps.score === maxScore &&
          playerScores.filter((p) => p.score === maxScore).length === 1 &&
          winCounts[ps.playerId] !== undefined
        ) {
          winCounts[ps.playerId]++;
        }
      }
    }

    return players
      .map((player) => ({
        _id: player._id,
        name: player.name,
        wins: winCounts[player._id] ?? 0,
        sessionsPlayed: sessionsPlayed[player._id] ?? 0,
        totalPoints: totalPoints[player._id] ?? 0,
      }))
      .sort(
        (a, b) =>
          b.wins - a.wins ||
          b.totalPoints - a.totalPoints ||
          b.sessionsPlayed - a.sessionsPlayed,
      );
  },
});
