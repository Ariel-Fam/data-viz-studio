import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    author: v.string(),
    body: v.optional(v.string()),
  }),

  datasets: defineTable({
    userId: v.string(),
    publicId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    columns: v.array(v.any()),
    rows: v.array(v.any()),
    createdAt: v.string(),
    source: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_public_id", ["userId", "publicId"]),

  mindMaps: defineTable({
    userId: v.string(),
    name: v.optional(v.string()),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    createdAt: v.optional(v.string()),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),
});
