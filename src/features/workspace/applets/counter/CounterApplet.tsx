import { useState } from "react";

export function CounterApplet() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex h-full flex-col gap-4 p-4 text-sm">
      <p className="text-muted-foreground">
        A tiny local counter stored within the workspace node.
      </p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-semibold" aria-live="polite">
          {count}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-xs font-medium transition hover:bg-muted"
            onClick={() => setCount((value) => value + 1)}
          >
            Increment
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-xs font-medium transition hover:bg-muted"
            onClick={() => setCount(0)}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
