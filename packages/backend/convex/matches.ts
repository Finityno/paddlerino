import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("matches").order("desc").collect();
  },
});

export const get = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    const players = await ctx.db
      .query("players")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    return { ...match, players };
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    return await ctx.db.insert("matches", {
      name: args.name.trim(),
      createdBy: user._id,
      status: "active",
      createdAt: Date.now(),
    });
  },
});
