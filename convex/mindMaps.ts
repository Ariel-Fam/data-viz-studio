import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listMyMindMaps = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const records = await ctx.db
      .query("mindMaps")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();

    return records
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((record) => ({
        id: String(record._id),
        name: record.name ?? "Untitled map",
        nodes: record.nodes,
        edges: record.edges,
        createdAt: record.createdAt ?? record.updatedAt,
        updatedAt: record.updatedAt,
      }));
  },
});

export const getMyMindMap = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const record = await ctx.db
      .query("mindMaps")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .first();

    if (!record) return null;
    return {
      nodes: record.nodes,
      edges: record.edges,
      updatedAt: record.updatedAt,
    };
  },
});

export const saveMindMap = mutation({
  args: {
    mapId: v.optional(v.string()),
    name: v.string(),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (args.mapId) {
      const normalizedId = ctx.db.normalizeId("mindMaps", args.mapId);
      if (normalizedId) {
        const existing = await ctx.db.get(normalizedId);
        if (existing && existing.userId === identity.tokenIdentifier) {
          await ctx.db.patch(existing._id, {
            name: args.name,
            nodes: args.nodes,
            edges: args.edges,
            updatedAt: new Date().toISOString(),
          });
          return String(existing._id);
        }
      }
    }

    const insertedId = await ctx.db.insert("mindMaps", {
      userId: identity.tokenIdentifier,
      name: args.name,
      nodes: args.nodes,
      edges: args.edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return String(insertedId);
  },
});

export const saveMyMindMap = mutation({
  args: {
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("mindMaps")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        nodes: args.nodes,
        edges: args.edges,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    await ctx.db.insert("mindMaps", {
      userId: identity.tokenIdentifier,
      nodes: args.nodes,
      edges: args.edges,
      updatedAt: new Date().toISOString(),
    });
  },
});
