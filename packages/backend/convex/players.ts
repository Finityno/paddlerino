import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const add = mutation({
  args: {
    matchId: v.id("matches"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    return await ctx.db.insert("players", {
      matchId: args.matchId,
      name: args.name.trim(),
    });
  },
});

export const remove = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const assignments = await ctx.db
      .query("sessionPlayers")
      .withIndex("by_playerId", (q) => q.eq("playerId", args.playerId))
      .first();

    if (assignments) {
      throw new Error("Cannot remove a player who has participated in sessions");
    }

    await ctx.db.delete(args.playerId);
  },
});
