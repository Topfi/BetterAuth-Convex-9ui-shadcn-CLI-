import { useMemo } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";

import { api } from "@/convex/api";

export type GeneratedAppletId = Parameters<
  typeof api.applets_generated.get
>[0]["appletId"];

interface GeneratedAppletRunnerProps {
  appletId: GeneratedAppletId;
}

export function GeneratedAppletRunner({
  appletId,
}: GeneratedAppletRunnerProps) {
  const doc = useQuery(api.applets_generated.get, { appletId });

  const entry = doc?.entry ?? "/App.tsx";

  const template = useMemo(
    () =>
      entry.endsWith(".ts") || entry.endsWith(".tsx") ? "react-ts" : "react",
    [entry],
  );
  // Memoize options to avoid reinitializing Sandpack on every render.
  const sandpackOptions = useMemo(
    () => ({
      autorun: true,
      recompileOnChange: true,
      activeFile: entry,
    }),
    [entry],
  );
  const sandpackSetup = useMemo(
    () => ({
      entry,
    }),
    [entry],
  );

  const files = (
    doc && doc.status === "succeeded"
      ? ((doc.files as Record<string, string>) ?? {})
      : {}
  ) as Record<string, string>;

  let content: JSX.Element;

  if (doc === undefined) {
    content = (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading generated applet…
      </div>
    );
  } else if (doc === null) {
    content = (
      <div className="p-4 text-sm text-muted-foreground">
        Applet unavailable.
      </div>
    );
  } else if (doc.status === "pending") {
    content = (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Queued for generation…
      </div>
    );
  } else if (doc.status === "running") {
    content = (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Generating applet in the background…
      </div>
    );
  } else if (doc.status === "failed") {
    content = (
      <div className="p-4 text-sm text-destructive">
        Generation failed{doc.error ? `: ${doc.error}` : "."}
      </div>
    );
  } else {
    content = (
      <div className="h-full overflow-hidden">
        <Sandpack
          template={template}
          files={files}
          options={sandpackOptions}
          customSetup={sandpackSetup}
        />
      </div>
    );
  }

  return content;
}
