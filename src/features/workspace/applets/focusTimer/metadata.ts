import { Timer } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { FocusTimerApplet } from "./FocusTimerApplet";

export const focusTimerApplet: WorkspaceApplet = {
  id: "focus_timer",
  name: "Focus Timer",
  description: "Pomodoro-style pacing with smooth controls and quick presets.",
  icon: Timer,
  Component: FocusTimerApplet,
  minSize: {
    width: 320,
    height: 260,
  },
};
