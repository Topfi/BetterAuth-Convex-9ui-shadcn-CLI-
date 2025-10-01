import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bot, Loader2, Sparkles } from "lucide-react";

import { api } from "@/convex/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

type GeneratedAppletId = Parameters<
  typeof api.applets_generated.get
>[0]["appletId"];

type GeneratorDoc = NonNullable<
  ReturnType<typeof useQuery<typeof api.applets_generated.listMine>>
>[number];

const STATUS_LABEL: Record<GeneratorDoc["status"], string> = {
  pending: "Pending",
  running: "Running",
  succeeded: "Ready",
  failed: "Failed",
};

const STATUS_VARIANT: Record<GeneratorDoc["status"], "secondary" | "info" | "success" | "danger"> = {
  pending: "secondary",
  running: "info",
  succeeded: "success",
  failed: "danger",
};

export function GeneratorApplet() {
  const [prompt, setPrompt] = useState("");
  const [activeAppletId, setActiveAppletId] =
    useState<GeneratedAppletId | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const documents = useQuery(api.applets_generated.listMine, {});
  const requestApplet = useMutation(api.applets_generated.request);
  const startBuild = useAction(api.applets_generated.startBuild);

  useEffect(() => {
    if (!documents || documents.length === 0 || activeAppletId) {
      return;
    }
    setActiveAppletId(documents[0]._id as GeneratedAppletId);
  }, [activeAppletId, documents]);

  const activeDoc =
    !activeAppletId || !documents
      ? null
      : documents.find((doc) => doc._id === activeAppletId) ?? null;

  const previewEntry =
    activeDoc?.status === "succeeded"
      ? (activeDoc.entry ?? "/App.tsx")
      : null;

  const previewFiles = useMemo(() => {
    if (!activeDoc || activeDoc.status !== "succeeded") {
      return null;
    }
    if (!activeDoc.files || typeof activeDoc.files !== "object") {
      return null;
    }

    const result: Record<string, string> = {};
    for (const [path, contents] of Object.entries(
      activeDoc.files as Record<string, unknown>,
    )) {
      if (typeof contents !== "string") {
        continue;
      }
      result[path] = contents;
    }

    return Object.keys(result).length > 0 ? result : null;
  }, [activeDoc]);

  const previewSrcDoc = useMemo(() => {
    if (!previewFiles || !previewEntry) {
      return null;
    }

    const filesJson = JSON.stringify(previewFiles).replace(
      /<\/(script)/gi,
      "<\\/$1",
    );
    const entryJson = JSON.stringify(previewEntry).replace(
      /<\/(script)/gi,
      "<\\/$1",
    );

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Generated Applet Preview</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #09090b; color: #f4f4f5; }
      #root { height: 100%; }
      pre { white-space: pre-wrap; word-break: break-word; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script>
      const FILES = ${filesJson};
      const ENTRY = ${entryJson};

      const moduleCache = new Map();

      const tryCandidates = (basePath, request) => {
        const normalize = (path) => {
          const segments = [];
          for (const part of path.split("/")) {
            if (!part || part === ".") continue;
            if (part === "..") segments.pop();
            else segments.push(part);
          }
          return "/" + segments.join("/");
        };

        const baseDir = basePath.slice(0, basePath.lastIndexOf("/") + 1);
        const target = request.startsWith(".")
          ? normalize(baseDir + request)
          : request;

        if (!request.startsWith(".")) {
          return [target];
        }

        const candidates = [target];
        const extensions = [".tsx", ".ts", ".jsx", ".js"];
        for (const ext of extensions) {
          candidates.push(target + ext);
        }
        for (const ext of extensions) {
          candidates.push(target + "/index" + ext);
        }
        return candidates;
      };

      const compileModule = (path) => {
        if (!FILES[path]) {
          throw new Error("Missing module: " + path);
        }
        const source = FILES[path];
        const transformed = window.Babel.transform(source, {
          filename: path,
          presets: [["env", { modules: "commonjs" }], "react"],
        }).code;

        const module = { exports: {} };
        const require = (specifier) => {
          if (specifier === "react") return window.React;
          if (specifier === "react-dom") return window.ReactDOM;
          if (specifier === "react-dom/client") return window.ReactDOM;

          const candidates = tryCandidates(path, specifier);
          for (const candidate of candidates) {
            if (FILES[candidate]) {
              return loadModule(candidate);
            }
          }

          throw new Error(
            "Cannot resolve '" + specifier + "' from " + path,
          );
        };

        const fn = new Function("exports", "require", "module", transformed);
        fn(module.exports, require, module);
        moduleCache.set(path, module.exports);
        return module.exports;
      };

      const loadModule = (path) => {
        if (moduleCache.has(path)) {
          return moduleCache.get(path);
        }
        return compileModule(path);
      };

      try {
        const exports = loadModule(ENTRY);
        const App = exports && exports.__esModule ? exports.default : exports.default || exports;
        if (typeof App !== "function") {
          throw new Error("Entry module does not export a component.");
        }
        const rootEl = document.getElementById("root");
        const root = window.ReactDOM.createRoot
          ? window.ReactDOM.createRoot(rootEl)
          : null;
        if (root) {
          root.render(window.React.createElement(App));
        } else {
          window.ReactDOM.render(window.React.createElement(App), rootEl);
        }
      } catch (error) {
        console.error(error);
        const pre = document.createElement("pre");
        pre.textContent = String(error?.stack || error?.message || error);
        document.body.innerHTML = "";
        document.body.appendChild(pre);
      }
    </script>
  </body>
</html>`;
  }, [previewEntry, previewFiles]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { appletId, name } = await requestApplet({ query: trimmed });
      const resolvedId = appletId as GeneratedAppletId;
      setActiveAppletId(resolvedId);
      setPrompt("");

      await toast.promise(startBuild({ appletId: resolvedId, prompt: trimmed }), {
        loading: {
          title: "Generating",
          description: `Synthesizing “${name ?? trimmed}”…`,
        },
        success: {
          title: "Generation started",
          description: "We will stream the result into this node shortly.",
        },
        error: (error) => ({
          title: "Generation failed to start",
          description:
            error instanceof Error
              ? error.message
              : "Unexpected error while starting the generator.",
        }),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start generation. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4 text-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">Generator</h2>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Bot className="size-3" aria-hidden />
            GPT-5
          </Badge>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="generator-prompt" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Describe the tool you need
          </Label>
          <Textarea
            id="generator-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="e.g. A tiny piano keyboard with playable notes"
            rows={3}
            autoComplete="off"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || prompt.trim().length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              "Generate"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={prompt.length === 0 || isSubmitting}
            onClick={() => setPrompt("")}
          >
            Clear
          </Button>
        </div>
      </form>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recent builds
          </p>
          {activeDoc ? (
            <Badge variant={STATUS_VARIANT[activeDoc.status]}>
              {STATUS_LABEL[activeDoc.status]}
            </Badge>
          ) : null}
        </div>
        <div className="flex max-h-32 flex-col gap-1 overflow-y-auto pr-1">
          {documents === undefined ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-3 animate-spin" aria-hidden />
              Loading history…
            </div>
          ) : documents.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Generated applets will appear here once you create them.
            </p>
          ) : (
            documents.map((doc) => {
              const id = doc._id as GeneratedAppletId;
              const isActive = id === activeAppletId;
              return (
                <button
                  key={String(doc._id)}
                  type="button"
                  onClick={() => setActiveAppletId(id)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition",
                    isActive
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  <span className="truncate text-sm font-medium">{doc.name}</span>
                  <Badge variant={STATUS_VARIANT[doc.status]} className="shrink-0">
                    {STATUS_LABEL[doc.status]}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-md border bg-background">
        {documents === undefined ? (
          <div className="flex h-full items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading generated applets…
          </div>
        ) : !activeDoc ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Describe a tool above and we will stream runnable JSX into this space.
          </div>
        ) : activeDoc.status === "pending" ? (
          <div className="flex h-full items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Queued for generation…
          </div>
        ) : activeDoc.status === "running" ? (
          <div className="flex h-full items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Generating applet preview…
          </div>
        ) : activeDoc.status === "failed" ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-destructive">
            Generation failed{activeDoc.error ? `: ${activeDoc.error}` : "."}
          </div>
        ) : !previewFiles ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            The generated applet has no previewable files.
          </div>
        ) : !previewSrcDoc ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Unable to assemble a preview for this applet.
          </div>
        ) : (
          <iframe
            title={`Preview of ${activeDoc.name}`}
            srcDoc={previewSrcDoc}
            sandbox="allow-scripts"
            className="size-full border-0"
          />
        )}
      </div>
    </div>
  );
}
