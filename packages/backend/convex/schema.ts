import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  matches: defineTable({
    name: v.string(),
    createdBy: v.string(),
    status: v.union(v.literal("active"), v.literal("completed")),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  players: defineTable({
    matchId: v.id("matches"),
    name: v.string(),
  }).index("by_matchId", ["matchId"]),

  sessions: defineTable({
    matchId: v.id("matches"),
    sessionNumber: v.number(),
    status: v.union(v.literal("in_progress"), v.literal("completed")),
  })
    .index("by_matchId", ["matchId"])
    .index("by_matchId_status", ["matchId", "status"]),

  sessionPlayers: defineTable({
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    score: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_playerId", ["playerId"]),
});
