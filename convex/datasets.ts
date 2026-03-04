import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listMyDatasets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const rows = await ctx.db
      .query("datasets")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();

    return rows
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((row) => ({
        id: row.publicId,
        name: row.name,
        description: row.description,
        columns: row.columns,
        rows: row.rows,
        createdAt: row.createdAt,
        source: row.source as "manual" | "csv" | "json" | "sample",
      }));
  },
});

export const createDataset = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    columns: v.array(v.any()),
    rows: v.array(v.any()),
    createdAt: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("datasets")
      .withIndex("by_user_public_id", (q) =>
        q.eq("userId", identity.tokenIdentifier).eq("publicId", args.id),
      )
      .first();

    if (existing) return args.id;

    await ctx.db.insert("datasets", {
      userId: identity.tokenIdentifier,
      publicId: args.id,
      name: args.name,
      description: args.description,
      columns: args.columns,
      rows: args.rows,
      createdAt: args.createdAt,
      source: args.source,
    });

    return args.id;
  },
});

export const updateDataset = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    columns: v.array(v.any()),
    rows: v.array(v.any()),
    createdAt: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("datasets")
      .withIndex("by_user_public_id", (q) =>
        q.eq("userId", identity.tokenIdentifier).eq("publicId", args.id),
      )
      .first();

    if (!existing) {
      await ctx.db.insert("datasets", {
        userId: identity.tokenIdentifier,
        publicId: args.id,
        name: args.name,
        description: args.description,
        columns: args.columns,
        rows: args.rows,
        createdAt: args.createdAt,
        source: args.source,
      });
      return args.id;
    }

    await ctx.db.patch(existing._id, {
      name: args.name,
      description: args.description,
      columns: args.columns,
      rows: args.rows,
      createdAt: args.createdAt,
      source: args.source,
    });

    return args.id;
  },
});

export const deleteDataset = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("datasets")
      .withIndex("by_user_public_id", (q) =>
        q.eq("userId", identity.tokenIdentifier).eq("publicId", args.id),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
