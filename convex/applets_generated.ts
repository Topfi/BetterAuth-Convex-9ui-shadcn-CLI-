import {
  action,
  internalMutation,
  mutation,
  query,
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { appletBuilder } from "./agents";
import slugify from "slugify";
import { hashStringHex } from "./hash";
import type { Id } from "./_generated/dataModel";
import {
  GENERATED_APPLET_ALLOWED,
  GENERATED_APPLET_FILE_COUNT_MAX,
  GENERATED_APPLET_FILE_TOTAL_MAX,
} from "../shared/workspace/generated";

type AuthenticatedCtx = MutationCtx | QueryCtx | ActionCtx;

const RATE_LIMIT_PATH = "applets_generate/request";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

const encoder = new TextEncoder();

const requireSubject = async (ctx: AuthenticatedCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }

  return identity.subject;
};

const normalizeAppletPath = (path: string) => {
  const normalized = path.replace(/\\/g, "/").replace(/\s+/g, "");
  const trimmed = normalized.replace(/^\/+/, "");
  return `/${trimmed}`;
};

const extractCommitToolError = (result: unknown): string | undefined => {
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const toolResults = (result as { toolResults?: unknown }).toolResults;
  if (!Array.isArray(toolResults)) {
    return undefined;
  }

  for (const entry of toolResults) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const toolName = (entry as { toolName?: unknown }).toolName;
    if (toolName !== "commitGeneratedApplet") {
      continue;
    }

    const output = (entry as { output?: unknown }).output;
    if (!output || typeof output !== "object") {
      continue;
    }

    const type = (output as { type?: unknown }).type;
    if (type !== "error-text") {
      continue;
    }

    const value = (output as { value?: unknown }).value;
    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return undefined;
};

const enforceRateLimit = async (ctx: MutationCtx, subject: string) => {
  const now = Date.now();
  const keyHash = await hashStringHex(`${subject}:${RATE_LIMIT_PATH}`);
  const ipHash = await hashStringHex(subject);
  const existing = await ctx.db
    .query("authRateLimits")
    .withIndex("by_keyHash", (q) => q.eq("keyHash", keyHash))
    .unique();

  if (existing) {
    const withinWindow = now - existing.lastRequest < RATE_LIMIT_WINDOW_MS;
    const count = withinWindow ? existing.count + 1 : 1;

    if (withinWindow && existing.count >= RATE_LIMIT_MAX) {
      throw new Error("Rate limit exceeded");
    }

    await ctx.db.patch(existing._id, {
      path: RATE_LIMIT_PATH,
      ipHash,
      count,
      lastRequest: now,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.insert("authRateLimits", {
    keyHash,
    path: RATE_LIMIT_PATH,
    ipHash,
    count: 1,
    lastRequest: now,
    updatedAt: now,
  });
};

const assertOwner = async (
  ctx: MutationCtx,
  appletId: Id<"generatedApplets">,
  subject: string,
) => {
  const doc = await ctx.db.get(appletId);
  if (!doc || doc.identitySubject !== subject) {
    throw new Error("Not found");
  }

  return doc;
};

export const request = mutation({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const subject = await requireSubject(ctx);
    await enforceRateLimit(ctx, subject);

    const slug = slugify(query, { lower: true, strict: true }) || "generated";
    const dup = await ctx.db
      .query("generatedApplets")
      .withIndex("byOwnerSlug", (q) =>
        q.eq("identitySubject", subject).eq("slug", slug),
      )
      .first();
    if (dup) {
      return { appletId: dup._id, slug, name: dup.name };
    }

    const now = Date.now();
    const appletId = await ctx.db.insert("generatedApplets", {
      identitySubject: subject,
      slug,
      name: query,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { appletId, slug, name: query };
  },
});

export const markRunning = mutation({
  args: { appletId: v.id("generatedApplets") },
  handler: async (ctx, { appletId }) => {
    const subject = await requireSubject(ctx);
    const id = ctx.db.normalizeId("generatedApplets", appletId);
    if (!id) {
      throw new Error("Invalid appletId");
    }
    await assertOwner(ctx, id, subject);

    await ctx.db.patch(id, {
      status: "running",
      updatedAt: Date.now(),
    });
  },
});

export const attachThread = mutation({
  args: { appletId: v.id("generatedApplets"), threadId: v.string() },
  handler: async (ctx, { appletId, threadId }) => {
    const subject = await requireSubject(ctx);
    const id = ctx.db.normalizeId("generatedApplets", appletId);
    if (!id) {
      throw new Error("Invalid appletId");
    }
    await assertOwner(ctx, id, subject);

    await ctx.db.patch(id, {
      threadId,
      updatedAt: Date.now(),
    });
  },
});

export const markFailed = mutation({
  args: { appletId: v.id("generatedApplets"), error: v.string() },
  handler: async (ctx, { appletId, error }) => {
    const subject = await requireSubject(ctx);
    const id = ctx.db.normalizeId("generatedApplets", appletId);
    if (!id) {
      throw new Error("Invalid appletId");
    }
    await assertOwner(ctx, id, subject);

    await ctx.db.patch(id, {
      status: "failed",
      error,
      updatedAt: Date.now(),
    });
  },
});

export const commit = internalMutation({
  args: {
    appletId: v.string(),
    files: v.any(),
    entry: v.string(),
    meta: v.object({
      name: v.string(),
      description: v.optional(v.string()),
      icon: v.optional(v.string()),
      minSize: v.optional(
        v.object({
          width: v.number(),
          height: v.number(),
        }),
      ),
    }),
  },
  handler: async (ctx, { appletId, files, entry, meta }) => {
    const id = ctx.db.normalizeId("generatedApplets", appletId);
    if (!id) {
      throw new Error("Invalid appletId");
    }

    const doc = await ctx.db.get(id);
    if (!doc) {
      throw new Error("Unknown appletId");
    }

    try {
      const rawFiles = files as Record<string, string>;
      const normalizedFiles: Record<string, string> = {};

      for (const [rawPath, contents] of Object.entries(rawFiles)) {
        const normalizedPath = normalizeAppletPath(rawPath);
        if (typeof contents !== "string") {
          throw new Error(`Non-string file: ${normalizedPath}`);
        }
        normalizedFiles[normalizedPath] = contents;
      }

      const keys = Object.keys(normalizedFiles);
      if (keys.length === 0) {
        throw new Error("No files provided");
      }
      if (keys.length > GENERATED_APPLET_FILE_COUNT_MAX) {
        throw new Error("Too many files");
      }

      let normalizedEntry = normalizeAppletPath(entry);
      if (!normalizedFiles[normalizedEntry]) {
        if (normalizedFiles["/App.tsx"]) {
          normalizedEntry = "/App.tsx";
        } else if (normalizedFiles["/index.tsx"]) {
          normalizedEntry = "/index.tsx";
        } else {
          throw new Error("Entry file missing");
        }
      }

      let totalBytes = 0;
      for (const filePath of keys) {
        if (!GENERATED_APPLET_ALLOWED.test(filePath)) {
          throw new Error(`Disallowed file path: ${filePath}`);
        }
        const contents = normalizedFiles[filePath];
        totalBytes += encoder.encode(contents).length;
      }

      if (totalBytes > GENERATED_APPLET_FILE_TOTAL_MAX) {
        throw new Error("Files too large");
      }

      await ctx.db.patch(id, {
        name: meta.name,
        description: meta.description,
        icon: meta.icon,
        minSize: meta.minSize,
        files: normalizedFiles,
        entry: normalizedEntry,
        status: "succeeded",
        error: undefined,
        updatedAt: Date.now(),
      });

      const logPayload = {
        level: "info",
        event: "generated_applet_committed",
        message: `Generated applet committed: ${String(id)}`,
        path: "applets/generated",
        actorSubject: doc.identitySubject,
        details: {
          entry,
          fileCount: String(keys.length),
          totalBytes: String(totalBytes),
        },
      } as const;

      try {
        if (ctx.scheduler?.runAfter) {
          await ctx.scheduler.runAfter(
            0,
            internal.auditLogs.recordSecurityEvent,
            logPayload,
          );
          return;
        }

        await ctx.db.insert("auditLogs", {
          event: logPayload.event,
          level: logPayload.level,
          message: logPayload.message,
          path: logPayload.path,
          actorSubject: logPayload.actorSubject,
          details: {
            entry: entry,
            fileCount: String(keys.length),
            totalBytes: String(totalBytes),
          },
          createdAt: Date.now(),
        });
      } catch {
        // ignore logging failures
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to commit generated applet.";
      await ctx.db.patch(id, {
        status: "failed",
        error: message,
        updatedAt: Date.now(),
      });
      throw error;
    }
  },
});

export const startBuild = action({
  args: { appletId: v.id("generatedApplets"), prompt: v.string() },
  handler: async (ctx, { appletId, prompt }) => {
    const subject = await requireSubject(ctx);
    const applet = await ctx.runQuery(api.applets_generated.get, {
      appletId,
    });

    if (!applet || applet.identitySubject !== subject) {
      throw new Error("Not found");
    }

    await ctx.runMutation(api.applets_generated.markRunning, { appletId });
    try {
      const { threadId, thread } = await appletBuilder.createThread(ctx);
      await ctx.runMutation(api.applets_generated.attachThread, {
        appletId,
        threadId,
      });

      const buildPrompt = (additionalLines: string[] = []) =>
        [
          `Build a minimal React applet named "${prompt}".`,
          "Use only standard React and plain JavaScript—do not include any TypeScript-specific syntax or types.",
          "Provide the complete source for each file as a string.",
          "When done, CALL commitGeneratedApplet once with:",
          `- appletId: "${String(appletId)}"`,
          '- files: { "/App.tsx": "..." }',
          '- entry: "/App.tsx" (or your chosen entry)',
          "- meta: { name, description?, icon?, minSize? }",
          "Always include the files record mapping each path (e.g. '/App.tsx') to its full source string.",
          ...additionalLines,
        ].join("\n");

      let followUp: string[] | undefined;
      let lastFailure: string | undefined;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await thread.generateText({
          prompt: buildPrompt(followUp ?? []),
        });

        const latest = await ctx.runQuery(api.applets_generated.get, {
          appletId,
        });

        if (!latest) {
          throw new Error("Generated applet document not found after build.");
        }

        if (latest.status === "succeeded") {
          return;
        }

        if (latest.status === "failed") {
          throw new Error(latest.error ?? "Generation failed.");
        }

        const commitError = extractCommitToolError(result);
        if (commitError) {
          lastFailure = commitError;
          const remedialLines = [
            "",
            "The previous commitGeneratedApplet call failed with this Convex validation error:",
            commitError,
            "",
          ];

          if (commitError.includes("Entry file missing")) {
            remedialLines.push(
              "Ensure '/App.tsx' exists in the files record and contains the default exported React component.",
              "If you only created components under '/components/', also create '/App.tsx' that imports and renders them.",
              "Example: files['/App.tsx'] = `import { Piano } from './components/Piano';\\nexport default function App() {\\n  return <Piano />;\\n}`;",
            );
          } else if (commitError.includes("No files provided")) {
            remedialLines.push(
              "Populate the files object with at least '/App.tsx' mapping to the full source string.",
            );
          } else if (commitError.includes("Disallowed file path")) {
            remedialLines.push(
              "Allowed paths: '/App.tsx', '/index.tsx', or files under '/components/'. Move your code into those paths.",
            );
          }

          remedialLines.push(
            "Call commitGeneratedApplet again immediately with the corrected files record, entry, and meta.",
          );

          followUp = remedialLines;
          continue;
        }

        lastFailure = "Agent exited without committing generated files.";
        followUp = [
          "",
          "You have not successfully called commitGeneratedApplet yet.",
          "Call commitGeneratedApplet now with the complete files record, entry path, and meta values.",
        ];
      }

      throw new Error(
        lastFailure ??
          "Agent exited without committing generated files after retries.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Generation failed to start";
      await ctx.runMutation(api.applets_generated.markFailed, {
        appletId,
        error: message,
      });
      throw error;
    }
  },
});

export const get = query({
  args: { appletId: v.id("generatedApplets") },
  handler: async (ctx, { appletId }) => {
    const subject = await requireSubject(ctx);
    const id = ctx.db.normalizeId("generatedApplets", appletId);
    if (!id) {
      return null;
    }

    const doc = await ctx.db.get(id);
    if (!doc || doc.identitySubject !== subject) {
      return null;
    }

    return doc;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const subject = await requireSubject(ctx);
    return await ctx.db
      .query("generatedApplets")
      .withIndex("byOwner", (q) => q.eq("identitySubject", subject))
      .order("desc")
      .collect();
  },
});
