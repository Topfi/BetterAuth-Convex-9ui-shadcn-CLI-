import { AlarmClock } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { FocusTimerApplet } from "./FocusTimerApplet";

export const focusTimerApplet: WorkspaceApplet = {
  id: "focusTimer",
  name: "Focus Timer",
  description:
    "Pomodoro-style pacing with quick presets and a smooth progress ring.",
  icon: AlarmClock,
  Component: FocusTimerApplet,
  minSize: {
    width: 280,
    height: 320,
  },
};
