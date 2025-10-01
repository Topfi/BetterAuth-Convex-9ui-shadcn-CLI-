import { Settings } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { SettingsApplet } from "./SettingsApplet";

export const settingsApplet: WorkspaceApplet = {
  id: "settings",
  name: "Settings",
  icon: Settings,
  Component: SettingsApplet,
  minSize: {
    width: 720,
    height: 480,
  },
};
