import type { Node } from "@xyflow/react";

import type { WorkspaceApplet } from "./applets/types";
import type { AppletNodeData } from "./types";

const DEFAULT_NODE_MIN_WIDTH = 240;
const DEFAULT_NODE_MIN_HEIGHT = 160;

const generateNodeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `node_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export type NewAppletNode = {
  node: Node<AppletNodeData>;
  persistence: {
    nodeId: string;
    appletId: string;
    label: string;
    position: { x: number; y: number; z: number };
    size: { width: number; height: number };
  };
};

export const buildNewAppletNode = (
  applet: WorkspaceApplet,
  existingCount: number,
  nextZIndex: number,
  onRemove: (id: string) => void,
): NewAppletNode => {
  const nodeId = generateNodeId();
  const offset = (existingCount + 1) * 48;
  const position = {
    x: offset % 360,
    y: offset % 240,
    z: nextZIndex,
  } as const;

  const minSize = applet.minSize ?? {
    width: DEFAULT_NODE_MIN_WIDTH,
    height: DEFAULT_NODE_MIN_HEIGHT,
  };

  const size = {
    width: minSize.width,
    height: minSize.height,
  } as const;

  const node: Node<AppletNodeData> = {
    id: nodeId,
    type: "appletNode",
    position: { x: position.x, y: position.y },
    data: {
      appletId: applet.id,
      label: applet.name,
      onRemove,
    },
    style: {
      width: size.width,
      height: size.height,
    },
    zIndex: position.z,
    width: size.width,
    height: size.height,
  };

  return {
    node,
    persistence: {
      nodeId,
      appletId: applet.id,
      label: applet.name,
      position,
      size,
    },
  };
};
