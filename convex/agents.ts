import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { Agent, createTool } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Tool: persist files + metadata into generatedApplets (single commit).
export const commitGeneratedApplet = createTool({
  description: "Persist the generated applet's Sandpack files and metadata.",
  args: z.object({
    appletId: z.string(),
    files: z.record(z.string(), z.string()),
    entry: z.string(),
    meta: z.object({
      name: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
      minSize: z.object({ width: z.number(), height: z.number() }).optional(),
    }),
  }),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.applets_generated.commit, args);
    return { ok: true };
  },
});

const APPLET_BUILDER_INSTRUCTIONS = [
  "Generate a minimal React applet runnable in a Sandpack 'react' template.",
  "Use only built-in React APIs and plain browser-safe JavaScript (no TypeScript syntax or type annotations).",
  "Prepare the full source for each file as plain strings and always include '/App.tsx' with a default export.",
  "When the code is ready, call commitGeneratedApplet with every required field:",
  "- appletId: the provided identifier.",
  "- files: a record such as { '/App.tsx': \"export default function App() { return <div>Hi</div>; }\" } (include all additional files you create).",
  "- entry: '/App.tsx' unless you explicitly add a different entry file to the files map.",
  "- meta: include the generated name and any optional metadata.",
  "Do not omit the files field. If the tool returns an error, correct the payload and retry immediately until it succeeds.",
  "Example call (use backticks for multi-line strings):",
  "commitGeneratedApplet({",
  "  appletId,",
  "  files: {",
  "    '/App.tsx': `export default function App() {\n  return <main>Example</main>;\n}`",
  "  },",
  "  entry: '/App.tsx',",
  "  meta: { name, description, icon, minSize }",
  "});",
].join("\n");

export const appletBuilder = new Agent(components.agent, {
  name: "Applet Builder",
  languageModel: openai.chat("gpt-5"),
  instructions: APPLET_BUILDER_INSTRUCTIONS,
  tools: { commitGeneratedApplet },
});

// Sanity action (kept internal)
export const _agentSanity = action({
  args: {},
  handler: async (ctx) => {
    const { thread } = await appletBuilder.createThread(ctx);
    const res = await thread.generateText({ prompt: "Reply: ready." });
    return res.text;
  },
});
