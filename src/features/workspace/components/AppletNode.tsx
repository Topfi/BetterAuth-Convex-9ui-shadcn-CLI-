import { NodeResizer, type NodeProps } from "@xyflow/react";
import { X } from "lucide-react";

import { getWorkspaceApplet } from "../applets/registry";
import { AppletNodeContextProvider } from "../context";
import type { AppletNodeData } from "../types";

export function AppletNode({ id, data, selected }: NodeProps<AppletNodeData>) {
  const applet = getWorkspaceApplet(data.appletId);
  const Body = applet?.Component;
  const minSize = applet?.minSize ?? { width: 240, height: 160 };

  return (
    <div className="bg-card text-card-foreground flex h-full w-full flex-col overflow-hidden rounded-lg border shadow-sm">
      <NodeResizer
        isVisible={selected}
        minWidth={minSize.width}
        minHeight={minSize.height}
        lineStyle={{
          borderColor: "hsl(var(--primary))",
          borderStyle: "dashed",
        }}
        handleStyle={{
          width: 12,
          height: 12,
          borderRadius: 4,
          background: "hsl(var(--primary))",
        }}
      />
      <div className="flex items-center justify-between border-b bg-transparent px-3 py-2 text-sm font-medium text-foreground">
        <span>{data.label}</span>
        <button
          type="button"
          className="text-foreground/80 hover:text-foreground transition"
          aria-label={`Close ${data.label}`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => data.onRemove(id)}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div
        className="flex-1 overflow-auto"
        onWheelCapture={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
        onTouchMoveCapture={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
        onPointerDownCapture={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDownCapture={(event) => event.stopPropagation()}
      >
        <AppletNodeContextProvider value={{ nodeId: id, data }}>
          {Body ? (
            <Body />
          ) : (
            <div className="p-4 text-xs text-muted-foreground">
              This applet is no longer available.
            </div>
          )}
        </AppletNodeContextProvider>
      </div>
    </div>
  );
}
