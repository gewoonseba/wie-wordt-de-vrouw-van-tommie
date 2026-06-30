import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { assertAdmin } from "./authTokens";

export const generateUploadUrl = mutation({
  args: {
    adminToken: v.string()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    return await ctx.storage.generateUploadUrl();
  }
});
