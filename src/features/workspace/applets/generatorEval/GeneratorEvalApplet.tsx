import { Sandpack } from "@codesandbox/sandpack-react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import { dracula } from "@codesandbox/sandpack-themes";
import { useMemo } from "react";

export function GeneratorEvalApplet() {
  // Memoize sandbox files to avoid reinitializing the runtime on each render.
  const files = useMemo<SandpackFiles>(() => ({}), []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Sandpack files={files} theme={dracula} template="react" />
    </div>
  );
}
