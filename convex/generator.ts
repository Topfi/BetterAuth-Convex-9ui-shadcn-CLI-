import { query, mutation, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal, components } from "./_generated/api";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { sendMessageSchema } from "../shared/generator";

type WithAuthCtx = QueryCtx | MutationCtx;

const requireIdentitySubject = async (ctx: WithAuthCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject;
};

// Best-effort authorization: ensure the current identity has any workspace node using this appletId.
// Note: appletId is unique per node instance passed from the UI (node id).
const assertAppletAccess = async (ctx: WithAuthCtx, subject: string, appletId: string) => {
  const node = await ctx.db
    .query("workspaceNodes")
    .withIndex("by_identitySubject_workspaceId", (q) => q.eq("identitySubject", subject))
    .filter((q) => q.eq(q.field("nodeId"), appletId))
    .first();

  if (!node) throw new Error("Applet not found or access denied");
  return node;
};

const canAccessApplet = async (
  ctx: WithAuthCtx,
  subject: string,
  appletId: string,
) => {
  const node = await ctx.db
    .query("workspaceNodes")
    .withIndex("by_identitySubject_workspaceId", (q) => q.eq("identitySubject", subject))
    .filter((q) => q.eq(q.field("nodeId"), appletId))
    .first();
  return Boolean(node);
};

export const listMessages = query({
  args: { appletId: v.string() },
  handler: async (ctx, { appletId }) => {
    const subject = await requireIdentitySubject(ctx);
    const ok = await canAccessApplet(ctx, subject, appletId);
    if (!ok) {
      // If the node was just removed or inaccessible, avoid throwing to keep UI smooth.
      return [] as Array<{ _id: Id<"generator_messages">; role: "user" | "assistant"; content: string }>;
    }

    const rows = await ctx.db
      .query("generator_messages")
      .withIndex("by_appletId", (q) => q.eq("appletId", appletId))
      .collect();

    // Order by server creation time
    const sorted = rows.sort((a, b) => a._creationTime - b._creationTime);
    return sorted.map((m) => ({
      _id: m._id,
      role: m.role,
      content: m.content,
    }));
  },
});

export const listMessagesInternal = internalQuery({
  args: { appletId: v.string() },
  handler: async (ctx, { appletId }) => {
    const rows = await ctx.db
      .query("generator_messages")
      .withIndex("by_appletId", (q) => q.eq("appletId", appletId))
      .collect();
    const sorted = rows.sort((a, b) => a._creationTime - b._creationTime);
    return sorted;
  },
});

export const sendMessage = mutation({
  args: { appletId: v.string(), prompt: v.string() },
  handler: async (ctx, args) => {
    const { appletId, prompt } = sendMessageSchema.parse(args);
    const subject = await requireIdentitySubject(ctx);
    const node = await assertAppletAccess(ctx, subject, appletId);

    // Persist user's message immediately (do not wait for model)
    const workspaceRow = await ctx.db
      .query("workspaces")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject).eq("workspaceId", node.workspaceId),
      )
      .unique();
    if (!workspaceRow) throw new Error("Workspace not found");

    await ctx.db.insert("generator_messages", {
      workspaceId: workspaceRow._id as Id<"workspaces">,
      appletId,
      role: "user",
      content: prompt,
    });

    // Schedule background response generation without awaiting
    if (ctx.scheduler && typeof ctx.scheduler.runAfter === "function") {
      void ctx.scheduler.runAfter(0, internal.generator.generateResponse, {
        appletId,
        prompt,
      });
    }

    return { ok: true as const };
  },
});

export const updateAssistantMessage = internalMutation({
  args: { messageId: v.id("generator_messages"), chunk: v.string() },
  handler: async (ctx, { messageId, chunk }) => {
    const existing = await ctx.db.get(messageId);
    if (!existing) return;
    await ctx.db.patch(messageId, { content: existing.content + chunk });
  },
});

export const createAssistantMessage = internalMutation({
  args: {
    appletId: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { appletId, workspaceId }) => {
    const insertedId = await ctx.db.insert("generator_messages", {
      workspaceId,
      appletId,
      role: "assistant",
      content: "",
    });
    return { messageId: insertedId };
  },
});

export const generateResponse = internalAction({
  args: { appletId: v.string(), prompt: v.string() },
  handler: async (ctx: ActionCtx, { appletId, prompt }) => {
    // Load history for context
    const internalRows = await ctx.runQuery(internal.generator.listMessagesInternal, { appletId });
    const history = internalRows.map((m: { role: "user" | "assistant" | string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Resolve workspace by appletId via workspaceNodes using an internal mutation trampoline that has DB access.
    const { messageId, workspaceId } = await ctx.runMutation(
      internal.generator.createAssistantFromApplet,
      {
        appletId,
      },
    );

    const assistantMessageId: Id<"generator_messages"> = messageId as Id<"generator_messages">;
    let codeBuffer = "";

    // Prefer Convex Agent SDK if available; otherwise, fall back to raw OpenAI streaming.
    const apiKey = process.env.OPENAI_API_KEY;
    let streamed = false;
    if (apiKey) {
      try {
        // Attempt to use Convex Agent SDK
        const impAgent: () => Promise<unknown> = (new Function(
          "return import('@convex-dev/agent')",
        ) as unknown) as () => Promise<unknown>;
        const impOpenAI: () => Promise<unknown> = (new Function(
          "return import('@ai-sdk/openai')",
        ) as unknown) as () => Promise<unknown>;

        const [agentMod, openaiMod] = await Promise.all([
          impAgent(),
          impOpenAI(),
        ]);

        type AgentCtor = new (
          component: unknown,
          options: { name: string; languageModel: unknown },
        ) => {
          generateText: (
            ctx: ActionCtx,
            ctxArgs: Record<string, unknown>,
            args: { prompt: string },
          ) => Promise<{ text?: string; output?: { text?: string } }>;
        };
        type OpenAIFactory = { chat: (model: string) => unknown };

        const AgentCtor = (agentMod as { Agent?: AgentCtor }).Agent;
        const openaiFactory = (openaiMod as { openai?: OpenAIFactory }).openai;

        if (AgentCtor && openaiFactory) {
          const instruction = `You are a code generator. Respond ONLY with a single self-contained React component (TypeScript/TSX), minimal external deps, no explanations. The component must run independently and implement the user's request. Keep it concise.`;
          const agent = new AgentCtor((components as unknown as { agent: unknown }).agent, {
            name: "Generator",
            languageModel: openaiFactory.chat("gpt-5"),
          });

          // Generate a complete response (non-stream) then chunk it for smoothness
          const result = await agent.generateText(ctx, {}, { prompt: `${instruction}\n\n${prompt}` });
          const text: string = (result && (result.text ?? result.output?.text)) || "";
          const CHUNK = 80;
          for (let i = 0; i < text.length; i += CHUNK) {
            const piece = text.slice(i, i + CHUNK);
            if (piece) {
              await ctx.runMutation(internal.generator.updateAssistantMessage, {
                messageId: assistantMessageId,
                chunk: piece,
              });
              codeBuffer += piece;
            }
          }
          streamed = true;
        }
      } catch (error) {
        // Fallback to direct HTTP streaming if Agent SDK isn't available
        try {
          const instruction = `You are a code generator. Respond ONLY with a single self-contained React component (TypeScript/TSX), minimal external deps, no explanations. The component must run independently and implement the user's request. Keep it concise.`;
          const messages = [
            { role: "system", content: instruction },
            ...history.map((m: { role: "user" | "assistant"; content: string }) => ({ role: m.role, content: m.content })),
            { role: "user", content: prompt },
          ];

          const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ model: "gpt-5", stream: true, messages }),
          });

          if (!resp.ok || !resp.body) throw new Error(`OpenAI HTTP ${resp.status}`);

          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          outer: while (true) {
            const { value, done } = await reader.read();
            if (done) break outer;
            buffer += decoder.decode(value, { stream: true });
            while (true) {
              const newlineIndex = buffer.indexOf("\n");
              if (newlineIndex === -1) break;
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);
              if (!line || !line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (data === "[DONE]") break outer;
              try {
                const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
                const delta = json.choices?.[0]?.delta?.content ?? "";
                if (delta) {
                  await ctx.runMutation(internal.generator.updateAssistantMessage, {
                    messageId: assistantMessageId,
                    chunk: delta,
                  });
                  codeBuffer += delta;
                }
              } catch (parseErr) {
                console.warn("[generator] Failed to parse OpenAI chunk", parseErr);
              }
            }
          }
          streamed = true;
        } catch (inner) {
          console.warn("[generator] OpenAI streaming failed, using mock.", inner);
        }
      }
    }

    if (!streamed) {
      const mock = buildMockReactComponent(prompt);
      const parts = mock.split(/(\n)/).filter(Boolean);
      for (const piece of parts) {
        await ctx.runMutation(internal.generator.updateAssistantMessage, {
          messageId: assistantMessageId,
          chunk: piece,
        });
        codeBuffer += piece;
      }
    }

    // Persist the finalized build if we have content
    if (codeBuffer.trim().length > 0) {
      await ctx.runMutation(internal.generator.saveBuild, {
        appletId,
        workspaceId: workspaceId as Id<"workspaces">,
        prompt,
        code: codeBuffer,
      });
    }
  },
});

// Helper: create an assistant message using the workspace that owns this node (appletId is nodeId).
export const createAssistantFromApplet = internalMutation({
  args: { appletId: v.string() },
  handler: async (
    ctx,
    { appletId },
  ): Promise<{ messageId: Id<"generator_messages">; workspaceId: Id<"workspaces"> }> => {
    // Find the workspace node by nodeId
    const node = await ctx.db
      .query("workspaceNodes")
      .withIndex("by_identitySubject_workspaceId", (q) => q.gt("identitySubject", ""))
      .filter((q) => q.eq(q.field("nodeId"), appletId))
      .first();
    if (!node) throw new Error("Applet node not found");

    const workspaceRow = await ctx.db
      .query("workspaces")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", node.identitySubject).eq("workspaceId", node.workspaceId),
      )
      .unique();
    if (!workspaceRow) throw new Error("Workspace not found");

    const { messageId } = (await ctx.runMutation(
      internal.generator.createAssistantMessage,
      {
        appletId,
        workspaceId: workspaceRow._id as Id<"workspaces">,
      },
    )) as { messageId: Id<"generator_messages"> };
    return {
      messageId,
      workspaceId: workspaceRow._id as Id<"workspaces">,
    } as {
      messageId: Id<"generator_messages">;
      workspaceId: Id<"workspaces">;
    };
  },
});

export const saveBuild = internalMutation({
  args: {
    appletId: v.string(),
    workspaceId: v.id("workspaces"),
    prompt: v.string(),
    code: v.string(),
  },
  handler: async (ctx, { appletId, workspaceId, prompt, code }) => {
    await ctx.db.insert("generator_builds", {
      appletId,
      workspaceId,
      prompt,
      code,
      createdAt: Date.now(),
    });
  },
});

export const listBuilds = query({
  args: { appletId: v.string() },
  handler: async (ctx, { appletId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const node = await ctx.db
      .query("workspaceNodes")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", identity.subject),
      )
      .filter((q) => q.eq(q.field("nodeId"), appletId))
      .first();
    if (!node) return [] as Array<{ _id: Id<"generator_builds">; prompt: string; code: string; createdAt: number }>;

    const rows = await ctx.db
      .query("generator_builds")
      .withIndex("by_appletId_createdAt", (q) => q.eq("appletId", appletId))
      .collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.map((r) => ({ _id: r._id, prompt: r.prompt, code: r.code, createdAt: r.createdAt }));
  },
});

function buildMockReactComponent(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("piano")) {
    return `import { useState } from 'react';

export default function Piano() {
  const notes = ['C','D','E','F','G','A','B'];
  const [last, setLast] = useState<string | null>(null);
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h3>Mini Piano</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        {notes.map((n) => (
          <button
            key={n}
            onClick={() => setLast(n)}
            style={{ padding: '12px 16px', borderRadius: 6, border: '1px solid #ccc' }}
          >
            {n}
          </button>
        ))}
      </div>
      <p style={{ marginTop: 12 }}>Last played: <strong>{last ?? '—'}</strong></p>
    </div>
  );
}`;
  }
  if (p.includes("calculator")) {
    return `import { useState } from 'react';

export default function Calculator() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const x = parseFloat(a) || 0;
  const y = parseFloat(b) || 0;
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 280 }}>
      <h3>Mini Calculator</h3>
      <input value={a} onChange={(e) => setA(e.target.value)} placeholder="A" style={{ width: '100%', marginBottom: 8 }} />
      <input value={b} onChange={(e) => setB(e.target.value)} placeholder="B" style={{ width: '100%', marginBottom: 8 }} />
      <ul>
        <li>Sum: {x + y}</li>
        <li>Diff: {x - y}</li>
        <li>Prod: {x * y}</li>
        <li>Quot: {y !== 0 ? x / y : '∞'}</li>
      </ul>
    </div>
  );
}`;
  }

  return `import { useState } from 'react';

export default function Widget() {
  const [text, setText] = useState('');
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 320 }}>
      <h3>Generated Widget</h3>
      <p style={{ opacity: 0.8 }}>Prompt: ${prompt.replace(/`/g, '\\`')}</p>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type here" style={{ width: '100%', marginTop: 8 }} />
      <p style={{ marginTop: 8 }}>Echo: {text}</p>
    </div>
  );
}`;
}
