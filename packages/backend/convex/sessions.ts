import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const list = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    const sessionsWithPlayers = await Promise.all(
      sessions.map(async (session) => {
        const playerScores = await ctx.db
          .query("sessionPlayers")
          .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
          .collect();
        return { ...session, playerScores };
      }),
    );

    return sessionsWithPlayers;
  },
});

export const getActive = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const activeSession = await ctx.db
      .query("sessions")
      .withIndex("by_matchId_status", (q) =>
        q.eq("matchId", args.matchId).eq("status", "in_progress"),
      )
      .first();

    if (!activeSession) return null;

    const playerScores = await ctx.db
      .query("sessionPlayers")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", activeSession._id))
      .collect();

    return { ...activeSession, playerScores };
  },
});

export const create = mutation({
  args: {
    matchId: v.id("matches"),
    playerIds: v.array(v.id("players")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_matchId_status", (q) =>
        q.eq("matchId", args.matchId).eq("status", "in_progress"),
      )
      .first();

    if (existing)
      throw new Error("An active session already exists for this match");

    const allSessions = await ctx.db
      .query("sessions")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    const sessionId = await ctx.db.insert("sessions", {
      matchId: args.matchId,
      sessionNumber: allSessions.length + 1,
      status: "in_progress",
    });

    for (const playerId of args.playerIds) {
      await ctx.db.insert("sessionPlayers", {
        sessionId,
        playerId,
        score: 0,
      });
    }

    return sessionId;
  },
});

export const updateScore = mutation({
  args: {
    sessionPlayerId: v.id("sessionPlayers"),
    delta: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const sp = await ctx.db.get(args.sessionPlayerId);
    if (!sp) throw new Error("Player score not found");

    const session = await ctx.db.get(sp.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "in_progress")
      throw new Error("Session is not active");

    const newScore = Math.max(0, sp.score + args.delta);
    await ctx.db.patch(args.sessionPlayerId, { score: newScore });

    return newScore;
  },
});

export const setScore = mutation({
  args: {
    sessionPlayerId: v.id("sessionPlayers"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const sp = await ctx.db.get(args.sessionPlayerId);
    if (!sp) throw new Error("Player score not found");

    const session = await ctx.db.get(sp.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "in_progress")
      throw new Error("Session is not active");

    if (!Number.isFinite(args.score)) throw new Error("Invalid score");
    const newScore = Math.max(0, Math.trunc(args.score));

    await ctx.db.patch(args.sessionPlayerId, { score: newScore });
    return newScore;
  },
});

export const end = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "in_progress")
      throw new Error("Session is already completed");

    await ctx.db.patch(args.sessionId, { status: "completed" });
  },
});
