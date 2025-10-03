import { SmilePlus } from "lucide-react";

import type { WorkspaceApplet } from "../types";
import { MoodTrackerApplet } from "./MoodTrackerApplet";

export const moodTrackerApplet: WorkspaceApplet = {
  id: "moodTracker",
  name: "Mood Tracker",
  description: "Quickly log your energy and jot context for future retros.",
  icon: SmilePlus,
  Component: MoodTrackerApplet,
  minSize: {
    width: 300,
    height: 360,
  },
};
