import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";

export const add = mutation({
  args: {
    matchId: v.id("matches"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

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
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

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
