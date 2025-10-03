import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import { dracula } from "@codesandbox/sandpack-themes";

import { api } from "@/convex/api";

type Props = {
  appletId: string;
};

export function GeneratorApplet({ appletId }: Props) {
  const { isAuthenticated } = useConvexAuth();
  const messages = useQuery(
    api.generator.listMessages,
    isAuthenticated ? { appletId } : ("skip" as const),
  );
  const builds = useQuery(
    api.generator.listBuilds,
    isAuthenticated ? { appletId } : ("skip" as const),
  );
  const sendMessage = useMutation(api.generator.sendMessage);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const isLoading = messages === undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;
    setInput("");
    if (!isAuthenticated) return;
    void sendMessage({ appletId, prompt }).catch((err) => {
      console.error("Failed to send message", err);
    });
  };

  const rendered = useMemo(() => {
    if (!messages) return null;
    return messages.map((m) => (
      <div
        key={(m as any)._id as string}
        className={
          m.role === "user"
            ? "bg-primary/10 text-primary-foreground/90 ml-auto max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs font-mono"
            : "bg-muted text-foreground/90 mr-auto max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs font-mono"
        }
        role="article"
        aria-label={m.role === "user" ? "User message" : "Generated code"}
      >
        {m.content}
      </div>
    ));
  }, [messages]);

  // Recent builds from Convex (persisted)
  const recentBuilds = builds ?? [];

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // Keep selection pinned to latest build by default
  useEffect(() => {
    if (recentBuilds.length === 0) {
      setSelectedIndex(null);
      return;
    }
    setSelectedIndex((prev) => {
      if (prev === null || prev >= recentBuilds.length) return 0; // newest-first
      return prev;
    });
  }, [recentBuilds.length]);

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const stabilizeTimerRef = useRef<number | null>(null);
  const lastAppliedRef = useRef<string | null>(null);

  // When selection or selected build changes, update code
  useEffect(() => {
    if (selectedIndex === null || recentBuilds.length === 0) {
      setGeneratedCode(null);
      return;
    }
    const current = recentBuilds[selectedIndex];
    const content = current?.code ?? "";
    const apply = () => {
      if (content && content !== lastAppliedRef.current) {
        setGeneratedCode(content);
        lastAppliedRef.current = content;
      }
    };
    apply();
    return () => {
      if (stabilizeTimerRef.current !== null) {
        window.clearTimeout(stabilizeTimerRef.current);
      }
    };
  }, [selectedIndex, recentBuilds]);

  const sandpackFiles = useMemo<SandpackFiles>(() => {
    if (!generatedCode) return {};
    const hasDefaultExport = /export\s+default\s+/m.test(generatedCode);
    const appTsx = hasDefaultExport
      ? generatedCode
      : `${generatedCode}\n\nexport default (typeof Generated !== 'undefined' ? Generated : (() => null));\n`;
    return {
      "/App.tsx": appTsx,
      "/main.tsx":
        "import React from 'react';\n" +
        "import { createRoot } from 'react-dom/client';\n" +
        "import App from './App';\n" +
        "const root = createRoot(document.getElementById('root')!);\n" +
        "root.render(<App />);\n",
    } satisfies SandpackFiles;
  }, [generatedCode]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={listRef}
        className="space-y-3 overflow-y-auto p-3"
        aria-busy={isLoading}
        aria-live="polite"
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : messages && messages.length > 0 ? (
          rendered
        ) : (
          <div className="text-sm text-muted-foreground">Describe what to generate (e.g. "piano", "calculator").</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex items-end gap-2">
          <label htmlFor="generator-input" className="sr-only">
            Prompt
          </label>
          <textarea
            id="generator-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type what to generate (React component code)"
            rows={2}
            className="min-h-[38px] flex-1 resize-none rounded-md border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-muted"
            aria-label="Generate"
            disabled={!isAuthenticated}
          >
            Generate
          </button>
        </div>
      </form>

      {/* Recent builds selector */}
      <div className="border-t bg-muted/20">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-foreground/80">
            Recent builds
          </span>
          <span className="text-[10px] text-muted-foreground">
            {recentBuilds.length} total
          </span>
        </div>
        <div className="flex flex-wrap gap-2 px-3 pb-2">
          {recentBuilds.map((b: { _id?: unknown; prompt: string }, idx) => {
            const active = idx === selectedIndex;
            const label = b.prompt.trim().slice(0, 28) || "(untitled)";
            return (
              <button
                key={String(b._id ?? idx)}
                type="button"
                aria-pressed={active}
                className={`rounded-md border px-2 py-1 text-[11px] ${
                  active ? "bg-background shadow-sm" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedIndex(idx)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sandpack runner area */}
      <div className="border-t">
        <Sandpack
          files={sandpackFiles}
          theme={dracula}
          template="react-ts"
          options={{
            externalResources: [],
            showConsole: true,
            autorun: true,
            recompileMode: "immediate",
            recompileDelay: 0,
            editorHeight: 240,
          }}
        />
      </div>
    </div>
  );
}
