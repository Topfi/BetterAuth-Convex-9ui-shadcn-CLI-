import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type WorkspaceAppletSize = {
  width: number;
  height: number;
};

export type WorkspaceAppletMetadata = {
  id: string;
  name: string;
  icon: LucideIcon;
  description?: string;
  minSize?: WorkspaceAppletSize;
};

export type WorkspaceApplet = WorkspaceAppletMetadata & {
  Component: ComponentType;
};
